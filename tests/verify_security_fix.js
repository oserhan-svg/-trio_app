const fs = require('fs');
const path = require('path');

function verifySecurityFix() {
    console.log('🔍 Verifying Security Fixes...');

    // 1. Verify Route Protection in dealRoutes.js
    const dealRoutesPath = path.join(__dirname, '../server/routes/dealRoutes.js');
    const dealRoutesContent = fs.readFileSync(dealRoutesPath, 'utf8');

    const routeRegex = /router\.post\('\/internal\/migrate',\s*authenticateToken,\s*authorizeRole\('admin'\),\s*dealController\.runInternalMigration\)/;
    if (routeRegex.test(dealRoutesContent)) {
        console.log('✅ PASS: /internal/migrate route is secured with POST, authenticateToken, and authorizeRole(\'admin\')');
    } else {
        console.error('❌ FAIL: /internal/migrate route is NOT correctly secured in dealRoutes.js');
        process.exit(1);
    }

    // 2. Verify Header Check in dealController.js
    const dealControllerPath = path.join(__dirname, '../server/controllers/dealController.js');
    const dealControllerContent = fs.readFileSync(dealControllerPath, 'utf8');

    const headerCheckRegex = /req\.headers\['x-internal-migration-key'\]/;
    const envCheckRegex = /process\.env\.INTERNAL_MIGRATION_KEY/;

    if (headerCheckRegex.test(dealControllerContent) && envCheckRegex.test(dealControllerContent)) {
        console.log('✅ PASS: runInternalMigration contains secondary header and env key check');
    } else {
        console.error('❌ FAIL: runInternalMigration is missing secondary header or env key check in dealController.js');
        process.exit(1);
    }

    console.log('\n✨ All security verification checks passed!');
}

verifySecurityFix();
