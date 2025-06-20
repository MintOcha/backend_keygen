const crypto = require('crypto');
const database = require('./database.js'); 
database.initDatabase(); // Initialize the database connection

function randomKey(){
    hex32 = crypto.randomBytes(15).toString('hex'); // One missing byte for checksum
    last_byte = crypto.createHash('sha256').update(hex32).digest()[0]; // Calculate checksum
    final_key =  hex32.slice(0, 8) + '-' + hex32.slice(8, 16) + '-' + hex32.slice(16, 24) + '-' + hex32.slice(24, 30) + hex32 + last_byte.toString(16); 
    final_key = final_key.toUpperCase(); // Convert to uppercase
    console.log("Generated Key:", final_key);
    return final_key;
}


function generateKey(addr, auth, tx, expiresAt) { // tx used as salt. it is the client download rate
try {
        const timestamp = Date.now();

        const randomKey = randomKey();
    
        
        // Log the request for debugging
        console.log(`Key generation request from ${clientIp}:`, {
            allArgs: req.body
        });

        // Add the key to the database

        
        // Response object
        
        const response = {
            ok: true,
            id: generatedKey,
            metadata: {
                ipAddress: clientIp,
                timestamp,
                expiresAt: expiresAt ? expiresAt.toISOString() : null,
            }
        };
        
       return response;
        
    } catch (error) {
        console.error('Error generating key:', error);
        return {
            success: false,
            error: 'Internal server error during key generation'
        };
    }
}