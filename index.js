const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

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
    try {
        // Get client IP address
        const clientIp = getClientIpAddress(req);
        
        // Get current timestamp
        const timestamp = Date.now();
        
        // Extract arguments from request body
        const {
            userId,
            purpose,
            expirationTime,
            customSalt,
            ...otherArgs
        } = req.body;
        
        // Generate or use provided salt
        const salt = customSalt || generateSalt();
        
        // Generate the key
        const generatedKey = generateKey(clientIp, timestamp, salt);
        
        // Calculate expiration timestamp if provided
        const expiresAt = expirationTime ? 
            new Date(timestamp + (expirationTime * 1000)) : 
            null;
        
        // Log the request for debugging
        console.log(`Key generation request from ${clientIp}:`, {
            userId,
            purpose,
            timestamp: new Date(timestamp).toISOString(),
            allArgs: req.body
        });
        
        // Response object
        const response = {
            success: true,
            key: generatedKey,
            metadata: {
                ipAddress: clientIp,
                timestamp,
                salt,
                userId,
                purpose,
                expiresAt: expiresAt ? expiresAt.toISOString() : null,
                requestArgs: otherArgs
            }
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error generating key:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during key generation'
        });
    }
});

// Key verification endpoint
app.post('/key/verify', (req, res) => {
    try {
        // Get client IP address
        const clientIp = getClientIpAddress(req);
        
        // Extract arguments from request body
        const {
            key,
            originalTimestamp,
            salt,
            originalIpAddress,
            userId,
            purpose,
            expirationTime,
            ...otherArgs
        } = req.body;
        
        // Validate required fields
        if (!key || !originalTimestamp || !salt) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: key, originalTimestamp, and salt are required'
            });
        }
        
        // Use provided IP or current IP for verification
        const ipForVerification = originalIpAddress || clientIp;
        
        // Regenerate the key with provided parameters
        const expectedKey = generateKey(ipForVerification, originalTimestamp, salt);
        
        // Check if key matches
        const isValid = crypto.timingSafeEqual(
            Buffer.from(key, 'hex'),
            Buffer.from(expectedKey, 'hex')
        );
        
        // Check expiration if provided
        let isExpired = false;
        if (expirationTime && originalTimestamp) {
            const expirationTimestamp = parseInt(originalTimestamp) + (expirationTime * 1000);
            isExpired = Date.now() > expirationTimestamp;
        }
        
        // Log the verification request
        console.log(`Key verification request from ${clientIp}:`, {
            keyToVerify: key,
            expectedKey,
            isValid,
            isExpired,
            userId,
            purpose,
            allArgs: req.body
        });
        
        // Response object
        const response = {
            success: true,
            isValid: isValid && !isExpired,
            details: {
                keyMatch: isValid,
                isExpired,
                verificationIp: ipForVerification,
                currentIp: clientIp,
                timestamp: Date.now(),
                userId,
                purpose,
                requestArgs: otherArgs
            }
        };
        
        res.status(200).json(response);
        
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
        message: 'Backend Keygen API',
        version: '1.0.0',
        endpoints: {
            generate: 'POST /key/generate',
            verify: 'POST /key/verify',
            health: 'GET /health'
        }
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
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Generate key: POST http://localhost:${PORT}/key/generate`);
    console.log(`Verify key: POST http://localhost:${PORT}/key/verify`);
});

module.exports = app;
