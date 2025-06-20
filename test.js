const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
    userId: 'testuser123',
    purpose: 'api-testing',
    expirationTime: 3600, // 1 hour
    customData: 'some custom information'
};

async function testKeyGeneration() {
    try {
        console.log('🔑 Testing Key Generation...');
        
        const response = await axios.post(`${BASE_URL}/key/generate`, testData);
        
        console.log('✅ Key generated successfully:');
        console.log('Key:', response.data.key);
        console.log('Metadata:', JSON.stringify(response.data.metadata, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('❌ Key generation failed:', error.response?.data || error.message);
        return null;
    }
}

async function testKeyVerification(keyData) {
    try {
        console.log('\n🔍 Testing Key Verification...');
        
        const verificationData = {
            key: keyData.key,
            originalTimestamp: keyData.metadata.timestamp,
            salt: keyData.metadata.salt,
            originalIpAddress: keyData.metadata.ipAddress,
            userId: keyData.metadata.userId,
            purpose: keyData.metadata.purpose,
            expirationTime: testData.expirationTime
        };
        
        const response = await axios.post(`${BASE_URL}/key/verify`, verificationData);
        
        console.log('✅ Key verification result:');
        console.log('Is Valid:', response.data.isValid);
        console.log('Details:', JSON.stringify(response.data.details, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('❌ Key verification failed:', error.response?.data || error.message);
        return null;
    }
}

async function testInvalidKey() {
    try {
        console.log('\n🚫 Testing Invalid Key Verification...');
        
        const invalidData = {
            key: 'invalid-key-123',
            originalTimestamp: Date.now(),
            salt: 'invalid-salt',
            userId: 'testuser123',
            purpose: 'api-testing'
        };
        
        const response = await axios.post(`${BASE_URL}/key/verify`, invalidData);
        
        console.log('✅ Invalid key test result:');
        console.log('Is Valid:', response.data.isValid);
        console.log('Details:', JSON.stringify(response.data.details, null, 2));
        
    } catch (error) {
        console.error('❌ Invalid key test failed:', error.response?.data || error.message);
    }
}

async function testHealthCheck() {
    try {
        console.log('\n🏥 Testing Health Check...');
        
        const response = await axios.get(`${BASE_URL}/health`);
        
        console.log('✅ Health check result:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Health check failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Backend Keygen API Tests...\n');
    
    // Test health check first
    await testHealthCheck();
    
    // Test key generation
    const keyData = await testKeyGeneration();
    
    if (keyData) {
        // Test valid key verification
        await testKeyVerification(keyData);
        
        // Test invalid key verification
        await testInvalidKey();
    }
    
    console.log('\n🎉 Tests completed!');
}

// Check if server is running before starting tests
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running, starting tests...\n');
        await runTests();
    } catch (error) {
        console.error('❌ Server is not running. Please start the server first with "npm start"');
        console.error('Error:', error.message);
    }
}

// Run the tests
checkServer();
