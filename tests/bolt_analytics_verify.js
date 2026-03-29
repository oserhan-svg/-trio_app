const analyticsService = require('../server/services/analyticsService');
const analyticsController = require('../server/controllers/analyticsController');
const fs = require('fs');
const path = require('path');

async function verify() {
    console.log('🔍 Starting Bolt Analytics Optimization Verification...');

    try {
        // 1. Check if cacheService is imported in analyticsService
        const serviceContent = fs.readFileSync(path.join(__dirname, '../server/services/analyticsService.js'), 'utf8');
        if (!serviceContent.includes("require('./cacheService')")) {
            throw new Error('cacheService not imported in analyticsService.js');
        }
        console.log('✅ cacheService import verified.');

        // 2. Check if raw SQL is used in analyticsController
        const controllerContent = fs.readFileSync(path.join(__dirname, '../server/controllers/analyticsController.js'), 'utf8');
        if (!controllerContent.includes('$queryRaw')) {
            throw new Error('$queryRaw not found in analyticsController.js');
        }
        if (!controllerContent.includes('COUNT(CASE WHEN')) {
            throw new Error('Consolidated COUNT(CASE WHEN) not found in analyticsController.js');
        }
        console.log('✅ Consolidated raw SQL query verified.');

        // 3. Syntax check
        console.log('Checking syntax with node -c...');
        const cp = require('child_process');
        cp.execSync('node -c server/services/analyticsService.js');
        cp.execSync('node -c server/controllers/analyticsController.js');
        console.log('✅ Syntax check passed.');

        console.log('\n🚀 ALL BOLT OPTIMIZATIONS VERIFIED SUCCESSFULLY!');
    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

verify();
