const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Change this to your backend server URL

// Test data
const testData = {
    addr: '127.0.0.1', // Added the required addr field
    expiresIn: 3600, // 1 hour
    customData: 'some custom information'
};

async function testKeyGeneration() {
    try {
        console.log('🔑 Testing Key Generation...');
        
        const response = await axios.post(`${BASE_URL}/key/generate`, testData);
        
        console.log('✅ Key generated successfully:');
        console.log('Key:', response.data.key);
        console.log('Details:', JSON.stringify(response.data.details, null, 2));
        
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
            addr: keyData.details.ipAddress,
            auth: keyData.key, // Using the generated key as auth
            tx: 'test-transaction'
        };
        
        const response = await axios.post(`${BASE_URL}/key/verify`, verificationData);
        
        console.log('✅ Key verification result:');
        console.log('OK:', response.data.ok);
        console.log('ID:', response.data.id);
        
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
            addr: '127.0.0.1',
            auth: 'invalid-key-123',
            tx: 'test-transaction'
        };
        
        const response = await axios.post(`${BASE_URL}/key/verify`, invalidData);
        
        console.log('✅ Invalid key test result:');
        console.log('OK:', response.data.ok);
        console.log('Error:', response.data.error);
        
    } catch (error) {
        console.error('✅ Invalid key test result:', error.response?.data || error.message);
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
