const fs = require('fs');
const path = require('path');

function verifySecurityFixes() {
    console.log('🔍 Verifying Sentinel Security Fixes...');

    // 1. Check dealRoutes.js for middleware
    const dealRoutesPath = path.join(__dirname, '../server/routes/dealRoutes.js');
    const dealRoutesContent = fs.readFileSync(dealRoutesPath, 'utf8');
    const migrateRouteLine = dealRoutesContent.split('\n').find(line => line.includes('/internal/migrate'));

    if (migrateRouteLine && migrateRouteLine.includes('authenticateToken') && migrateRouteLine.includes("authorizeRole('admin')")) {
        console.log('✅ PASS: /api/deals/internal/migrate is secured with authentication and admin authorization.');
    } else {
        console.error('❌ FAIL: /api/deals/internal/migrate is NOT correctly secured.');
        process.exit(1);
    }

    // 2. Check userController.js for log sanitization
    const userControllerPath = path.join(__dirname, '../server/controllers/userController.js');
    const userControllerContent = fs.readFileSync(userControllerPath, 'utf8');

    if (userControllerContent.includes('delete logBody.password') && userControllerContent.includes('console.log(`[UPDATE USER] ID: ${id}, Body:`, logBody)')) {
        console.log('✅ PASS: updateUser logs are sanitized (password excluded).');
    } else {
        console.error('❌ FAIL: updateUser logs are NOT sanitized.');
        process.exit(1);
    }

    console.log('\n✨ All security verifications passed!');
}

verifySecurityFixes();
