const crypto = require('crypto');
const database = require('./database.js'); 
const config = require('../config.json');

// Load configuration values
const ipCheck = config.security.ipCheck;
const allowLocalhostBypass = config.security.allowLocalhostBypass;
const enableDetailedLogging = config.server.enableDetailedLogging;

// Initialize the database connection asynchronously
database.initDatabase().then(() => {
    console.log('Database initialized successfully');
}).catch(error => {
    console.error('Failed to initialize database:', error);
});

function randomKey(){
    const hex32 = crypto.randomBytes(15).toString('hex'); // One missing byte for checksum
    const last_byte = crypto.createHash('sha256').update(hex32).digest()[0]; // Calculate checksum
    const final_key = hex32.slice(0, 8) + '-' + hex32.slice(8, 16) + '-' + hex32.slice(16, 24) + '-' + hex32.slice(24, 30) + last_byte.toString(16).padStart(2, '0'); 
    const upperKey = config.keys.keyFormat.useUppercase ? final_key.toUpperCase() : final_key;
    if (enableDetailedLogging) {
        console.log("Generated Key:", upperKey);
    }
    return upperKey;
}

function verifyKeyHash(key){
    key = key.replace(/-/g, ''); // Remove dashes
    key = key.toLowerCase(); 
    if (key.length !== 32) {
        console.error("Invalid key length:", key.length);
        return false;
    }
    const first_part = key.slice(0, 30);
    const hash = crypto.createHash('sha256').update(first_part).digest()[0];
    const last_byte = parseInt(key.slice(30, 32), 16);
    console.log("Verifying Key:", key, "Hash:", hash, "Last Byte:", last_byte);
    return hash === last_byte;
}


function generateKey(addr, expiresAt) { // tx used as salt. it is the client download rate
    const timestamp = Date.now();
    const generatedKey = randomKey(); // Fixed: renamed to avoid conflict with function name

    // Log the request for debugging
    console.log(`Key generation request from ${addr}`);    // Add the key to the database - Store as Unix timestamps
    const query = `INSERT INTO keys (key, ipAddress, timestamp, expiresAt) VALUES (?, ?, ?, ?)`;
    const params = [generatedKey, addr, timestamp, expiresAt || null];
    
    return database.querySQL(query, params)
    .then(() => {
        console.log('Key successfully added to the database!');
        
        // Response object - Fixed variable name
        const response = {
            success: true,
            key: generatedKey, // Fixed: use generatedKey instead of undefined variable
            details: {
                ipAddress: addr,
                timestamp: new Date(timestamp).toISOString(),
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            }        }; // Always return ISO Strings for consistency
        
        return response;
    })
    .catch(error => {
        console.error('Error adding key to database:', error);
        throw error;
    });
}

function verifyKey(key, clientIp = null){
    // Log the verification request for debugging
    console.log(`Key verification request for key: ${key}, clientIp: ${clientIp}`);

    if (!verifyKeyHash(key)) {
        console.log('Invalid key format');
        return Promise.resolve({ isValid: false, details: null, reason: 'Invalid key format' });
    }

    // Query the database to check if the key exists - Fixed SQL for SQLite
    return database.querySQL(`SELECT * FROM keys WHERE key = ?`, [key])
        .then(results => {
            console.log('Database query results:', results); // Debug log
            
            if (results.length === 1) {
                const keyData = results[0];                // Check IP address if ipCheck is enabled and clientIp is provided
                if (ipCheck && clientIp && keyData.ipAddress !== clientIp) {
                    // Allow localhost connections to pass if configured (IPv4 vs IPv6 localhost)
                    if (allowLocalhostBypass) {
                        const isLocalhostStored = keyData.ipAddress === '127.0.0.1' || keyData.ipAddress === '::1';
                        const isLocalhostClient = clientIp === '127.0.0.1' || clientIp === '::1';
                        
                        if (isLocalhostStored && isLocalhostClient) {
                            if (enableDetailedLogging) {
                                console.log('Localhost IP check bypass:', {
                                    storedIp: keyData.ipAddress,
                                    clientIp: clientIp,
                                    localhostBypass: true
                                });
                            }
                        } else {
                            console.log('IP mismatch:', {
                                storedIp: keyData.ipAddress,
                                clientIp: clientIp,
                                ipCheckEnabled: ipCheck,
                                localhostBypass: false
                            });
                            return {
                                isValid: false,
                                details: {
                                    key: keyData.key,
                                    ipAddress: keyData.ipAddress,
                                    timestamp: keyData.timestamp,
                                    expiresAt: keyData.expiresAt
                                },
                                reason: 'IP address mismatch'
                            };
                        }
                    } else {
                        console.log('IP mismatch:', {
                            storedIp: keyData.ipAddress,
                            clientIp: clientIp,
                            ipCheckEnabled: ipCheck,
                            localhostBypass: false
                        });
                        return {
                            isValid: false,
                            details: {
                                key: keyData.key,
                                ipAddress: keyData.ipAddress,
                                timestamp: keyData.timestamp,
                                expiresAt: keyData.expiresAt
                            },
                            reason: 'IP address mismatch'
                        };
                    }
                }
                
                // Check if key is still valid (not expired) - comparing Unix timestamps
                let isValid = true;
                let reason = null;
                if (keyData.expiresAt) {
                    const currentTime = Date.now();
                    isValid = keyData.expiresAt > currentTime;
                    if (!isValid) {
                        reason = 'Key expired';
                    }
                    console.log('Expiration check:', {
                        expiresAt: keyData.expiresAt,
                        expiresAtDate: new Date(keyData.expiresAt).toISOString(),
                        currentTime: new Date(currentTime).toISOString(),
                        currentDate: new Date(currentTime).toISOString(),
                        isValid
                    });
                }

                return {
                    isValid,
                    details: {
                        key: keyData.key,
                        ipAddress: keyData.ipAddress,
                        timestamp: keyData.timestamp,
                        expiresAt: keyData.expiresAt
                    },
                    reason
                };
            } else {
                console.log('Key not found in database');
                return { isValid: false, details: null, reason: 'Key not found in database' };
            }
        })
        .catch(error => {
            console.error('Error verifying key:', error);
            throw error;
        });
}

module.exports = {
    generateKey,
    verifyKey,
    ipCheck
}