const http = require('http');
const { spawn } = require('child_process');

const BASE_URL = 'http://127.0.0.1:5005';
const VALID_KEY = 'trio-extension-secure-v1';
const INVALID_KEY = 'wrong-key';

function request(method, path, headers = {}, data = {}) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 5005,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => resData += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: resData ? JSON.parse(resData) : null
                });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Extension Authentication Tests...');

    const endpoints = [
        { url: '/api/scraper/import', method: 'POST', data: { listings: [], provider: 'test' } },
        { url: '/api/scraper/finished', method: 'POST', data: { provider: 'test', reason: 'test' } },
        { url: '/api/whatsapp/extension-sync', method: 'POST', data: { partnerName: 'test', messages: [] } }
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
        console.log(`\nTesting ${endpoint.url}...`);

        // 1. Test without API Key
        try {
            const res = await request(endpoint.method, endpoint.url);
            if (res.status === 401) {
                console.log(`✅ PASS: ${endpoint.url} rejected request without API Key (401)`);
            } else {
                console.error(`❌ FAIL: ${endpoint.url} returned unexpected status ${res.status} without API Key`);
                allPassed = false;
            }
        } catch (error) {
            console.error(`❌ FAIL: ${endpoint.url} error without API Key: ${error.message}`);
            allPassed = false;
        }

        // 2. Test with invalid API Key
        try {
            const res = await request(endpoint.method, endpoint.url, { 'x-api-key': INVALID_KEY });
            if (res.status === 403) {
                console.log(`✅ PASS: ${endpoint.url} rejected request with invalid API Key (403)`);
            } else {
                console.error(`❌ FAIL: ${endpoint.url} returned unexpected status ${res.status} with invalid API Key`);
                allPassed = false;
            }
        } catch (error) {
            console.error(`❌ FAIL: ${endpoint.url} error with invalid API Key: ${error.message}`);
            allPassed = false;
        }

        // 3. Test with valid API Key
        try {
            const res = await request(endpoint.method, endpoint.url, { 'x-api-key': VALID_KEY }, endpoint.data);
            if (res.status === 200) {
                console.log(`✅ PASS: ${endpoint.url} accepted request with valid API Key (200)`);
            } else {
                console.error(`❌ FAIL: ${endpoint.url} returned status ${res.status} with valid API Key`);
                console.error('Response:', res.data);
                allPassed = false;
            }
        } catch (error) {
            console.error(`❌ FAIL: ${endpoint.url} rejected request with valid API Key: ${error.message}`);
            allPassed = false;
        }
    }

    if (allPassed) {
        console.log('\n✨ ALL EXTENSION AUTH TESTS PASSED! ✨');
        process.exit(0);
    } else {
        console.error('\n❌ SOME TESTS FAILED. ❌');
        process.exit(1);
    }
}

console.log('Starting server...');
const server = spawn('node', ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: 5005, EXTENSION_API_KEY: VALID_KEY, NODE_ENV: 'test' }
});

server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[SERVER] ${output.trim()}`);
    if (output.includes('SERVER ACTIVE ON PORT 5005')) {
        runTests().then(() => {
            console.log('Shutting down server...');
            server.kill();
        });
    }
});

server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data}`);
});

setTimeout(() => {
    console.error('Timeout waiting for server to start');
    server.kill();
    process.exit(1);
}, 15000);
