const crypto = require('crypto');
const database = require('./database.js'); 

// Initialize the database connection asynchronously
database.initDatabase().then(() => {
    console.log('Database initialized successfully');
}).catch(error => {
    console.error('Failed to initialize database:', error);
});

function randomKey(){
    const hex32 = crypto.randomBytes(15).toString('hex'); // One missing byte for checksum
    const last_byte = crypto.createHash('sha256').update(hex32).digest()[0]; // Calculate checksum
    const final_key = hex32.slice(0, 8) + '-' + hex32.slice(8, 16) + '-' + hex32.slice(16, 24) + '-' + hex32.slice(24, 30) + last_byte.toString(16); 
    const upperKey = final_key.toUpperCase(); // Convert to uppercase
    console.log("Generated Key:", upperKey);
    return upperKey;
}

function verifyKeyHash(key){
    key = key.replace(/-/g, ''); // Remove dashes
    key = key.toLowerCase(); 
    if (key.length !== 32) {
        console.error("Invalid key length:", key.length);
        return false;
    }
    first_part = key.slice(0, 30);
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

function verifyKey(key){
    // Log the verification request for debugging
    console.log(`Key verification request for key: ${key}`);

    if (!verifyKeyHash(key)) {
        console.log('Invalid key format or checksum');
        return { isValid: false, details: null };
    }

    // Query the database to check if the key exists - Fixed SQL for SQLite
    return database.querySQL(`SELECT * FROM keys WHERE key = ?`, [key])
        .then(results => {
            console.log('Database query results:', results); // Debug log
            
            if (results.length === 1) {
                const keyData = results[0];
                
                // Check if key is still valid (not expired) - comparing Unix timestamps
                let isValid = true;
                if (keyData.expiresAt) {
                    const currentTime = Date.now();
                    isValid = keyData.expiresAt > currentTime;
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
                    }
                };
            } else {
                console.log('Key not found in database');
                return { isValid: false, details: null };
            }
        })
        .catch(error => {
            console.error('Error verifying key:', error);
            throw error;
        });
}

module.exports = {
    generateKey,
    verifyKey
}