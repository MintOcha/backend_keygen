const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const keygen = require('./utils/keymodule'); 
const config = require('./config.json');
const app = express();
const PORT = process.env.PORT || config.server.port;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Helper function to get client IP address
function getClientIpAddress(req) {
    return req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip;
}

// Helper function to generate a key based on IP, timestamp, and salt
function generateKey(ipAddress, timestamp, salt) {
    const data = `${ipAddress}-${timestamp}-${salt}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to generate random salt
function generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

// Key generation endpoint
app.post('/key/generate', (req, res) => {
    // const clientIp = getClientIpAddress(req);
    const nextDay = Date.now() + 86400 * 1000; // Defaults to 1 day expiration
    
    // Extract arguments from request body
    const { addr, expiresIn } = req.body;
    
    // Use provided expiresAt if available, otherwise use nextDay
    const expiration = Date.now() + expiresIn * 1000 || nextDay;

    keygen.generateKey(addr, expiration) // ONLY responsible for generating key, does not check auth
        .then((response) => {
            res.status(200).json(response);
        })
        .catch((error) => {
            console.error('Error generating key:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate key'
            });
        });
    
}); // Endpoint should NOT be exposed to the public. Local endpt for hy2 to call

// Key verification endpoint
app.post('/key/verify', async (req, res) => {
    try {
        const {
            addr,
            auth,
            tx
        } = req.body; // Format fits hysteria2 needs


        // Validate required fields
        if (!addr || !auth) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });        }
        
        const keyValidity = await keygen.verifyKey(auth, addr); // Fixed: use clientIp instead of addr
        
        
        // Log the verification request
        console.log(`Key verification request from ${addr}:`, {
            keyToVerify: auth,
            isValid: keyValidity.isValid,
            reason: keyValidity.reason,
            ipCheckEnabled: keygen.ipCheck,
            allArgs: req.body
        }); // Only log req body and response basically
        

        if (keyValidity.isValid) {
            return res.status(200).json({
                ok: true,
                id: auth
            });
        } else {
            return res.status(400).json({
                ok: false,
                error: keyValidity.reason || 'Invalid/expired key'
            });
        }

    } catch (error) {
        console.error('Error verifying key:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during key verification'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Backend Keygen API. If you see this from outside, please configure this endpoint to NOT be forwarded.',
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend Keygen server is running on port ${PORT}`);
});

module.exports = app;
