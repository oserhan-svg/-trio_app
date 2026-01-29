require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 STARTING DIAGNOSTIC CHECK...');

async function testModule(name, path) {
    try {
        process.stdout.write(`Testing ${name}... `);
        const start = Date.now();
        require(path);
        console.log(`✅ OK (${Date.now() - start}ms)`);
    } catch (error) {
        console.log(`❌ FAILED`);
        console.error(`\n!!! CRASH DETECTED IN ${name} !!!`);
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function run() {
    // 1. Check Env
    console.log('\n--- Environment ---');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'MISSING');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'MISSING');

    // 2. Check DB
    console.log('\n--- Modules ---');
    await testModule('Database (Prisma)', './db');

    // 3. Check Services
    await testModule('Google Calendar Service', './services/googleCalendarService');
    await testModule('Scraper Service', './services/scraperService');

    // 4. Check Routes
    await testModule('Google Auth Routes', './routes/googleAuthRoutes');

    console.log('\n✅ ALL CRITICAL MODULES LOADED SUCCESSFULLY.');
    console.log('If the server still fails, the issue is likely in app.listen or a runtime error after startup.');
}

run();
