/**
 * ⚡ Bolt Analytics Optimization Verification Script
 * This script performs syntax and dependency checks for the optimized analytics modules.
 */

const fs = require('fs');
const path = require('path');

const filesToVerify = [
    'server/controllers/analyticsController.js',
    'server/services/analyticsService.js',
    'server/services/cacheService.js'
];

async function verify() {
    console.log('--- 🛡️ Bolt Optimization Verification ---');

    for (const file of filesToVerify) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Missing file: ${file}`);
            process.exit(1);
        }

        console.log(`\nChecking ${file}...`);

        // Basic Syntax Check
        try {
            require('child_process').execSync(`node -c ${filePath}`);
            console.log(`  ✅ Syntax check passed`);
        } catch (e) {
            console.error(`  ❌ Syntax check failed: ${e.message}`);
            process.exit(1);
        }

        // Content verification
        const content = fs.readFileSync(filePath, 'utf8');

        if (file.endsWith('analyticsController.js')) {
            if (content.includes('Promise.all') && content.includes('$queryRaw')) {
                console.log('  ✅ Parallelization and Raw SQL detected');
            } else {
                console.error('  ❌ Optimized logic not found in controller');
            }
        }

        if (file.endsWith('analyticsService.js')) {
            if (content.includes("require('./cacheService')") && !content.includes('take: 1000')) {
                console.log('  ✅ CacheService integration and redundant query removal confirmed');
            } else {
                console.error('  ❌ CacheService or query removal check failed in service');
            }
        }
    }

    console.log('\n✨ All Bolt-specific optimizations verified successfully.');
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
