# Backend Keygen API

A Node.js backend server for generating and verifying cryptographic keys. For use with hysteria2 verification (for now), using addr, auth, tx as the parameters. Not meant to be exposed to public, but for use of local programs ONLY. do NOT expose this endpoint.

## Features

- **Key Generation**: Generate secure keys based on client IP, timestamp, and salt
- **Key Verification**: Verify previously generated keys
- **IP Address Detection**: Automatically detects client IP address including proxy headers
- **Flexible Parameters**: Accepts custom arguments and metadata
- **Security**: Uses timing-safe comparison for key verification. Checksum present within keygen 
- **CORS Support**: Enabled for cross-origin requests
- **Security Headers**: Helmet middleware for security

### TODO
- **IP anti-spam support**: Ban users off requests if IP is used excessively.
- **Different methods of keygen**: Completely random keygen OR based off salted info

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /key/generate

Generates a new key based on the client's IP address, current timestamp, and optional parameters.

**Request Body:**
```json
{
    "addr": "0.0.0.0", // Logged address of user (Note: This is backend!)
    "expiresIn": 86400 // Seconds to key expiry. Defaults to 1 day.
}
```

**Response:**
```json
{
  success: true,
  key: generatedKey,
  details: {
      ipAddress: addr,
      timestamp,
      expiresAt: expiresAt,
  }
}
```

### POST /key/verify

Verifies a previously generated key.

**Request Body:**
```json
{
    "key": "a1b2c3d4e5f6...",
    "originalTimestamp": 1703097600000,
    "salt": "randomsalt123",
    "originalIpAddress": "192.168.1.100",
    "userId": "user123",
    "purpose": "authentication",
    "expirationTime": 3600
}
```

**Response:**
```json
{
    "success": true,
    "isValid": true,
    "details": {
        "keyMatch": true,
        "isExpired": false,
        "verificationIp": "192.168.1.100",
        "currentIp": "192.168.1.100",
        "timestamp": 1703097660000,
        "userId": "user123",
        "purpose": "authentication",
        "requestArgs": {}
    }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2023-12-20T15:30:00.000Z",
    "uptime": 3600
}
```

## Usage Examples

### Generate a Key
```bash
curl -X POST http://localhost:3000/key/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "purpose": "api-access",
    "expirationTime": 3600
  }'
```

### Verify a Key
```bash
curl -X POST http://localhost:3000/key/verify \
  -H "Content-Type: application/json" \
  -d '{
    "key": "your-generated-key-here",
    "originalTimestamp": 1703097600000,
    "salt": "your-salt-here",
    "userId": "user123",
    "purpose": "api-access",
    "expirationTime": 3600
  }'
```

## Key Generation Algorithm

Keys are generated using the following process:
1. Extract client IP address (with proxy header support)
2. Get current timestamp
3. Generate or use provided salt
4. Create data string: `${ipAddress}-${timestamp}-${salt}`
5. Generate SHA-256 hash of the data string

## Security Features

- **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual()` for key verification
- **Helmet Security**: Adds security headers
- **CORS Support**: Configurable cross-origin resource sharing
- **Input Validation**: Validates required fields
- **Error Handling**: Comprehensive error handling and logging

## Environment Variables

- `PORT`: Server port (default: 3000)

## Development

The server includes detailed logging for debugging purposes. All requests are logged with relevant metadata.

## License

ISC
