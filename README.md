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

Test the server:
````bash
npm run test
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
  "success": true,
  "key": "generatedKey",
  "details": {
      "ipAddress": "addr",
      "timestamp": 1703097600000,
      "expiresAt": 1703184000000
  }
}
```

### POST /key/verify

Verifies a previously generated key.

**Request Body:**
```json
{
    addr, // Client address
    auth, // Client auth value
    tx // Transmission rate on server, included by default for hy2.
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

## Development

The server includes detailed logging for debugging purposes. All requests are logged with relevant metadata.

## License

ISC
