const fs = require('fs');
const path = require('path');

function verifyFixes() {
    console.log('--- Verifying Sentinel Fixes ---');

    // 1. Verify Deal Routes Security
    const dealRoutesPath = path.join(__dirname, '../server/routes/dealRoutes.js');
    const dealRoutesContent = fs.readFileSync(dealRoutesPath, 'utf8');
    const isMigrationSecured = dealRoutesContent.includes("router.get('/internal/migrate', authenticateToken, authorizeRole('admin'), dealController.runInternalMigration);");
    console.log(`[1] Migration Route Secured: ${isMigrationSecured ? '✅ PASS' : '❌ FAIL'}`);

    // 2. Verify User Controller Logging
    const userControllerPath = path.join(__dirname, '../server/controllers/userController.js');
    const userControllerContent = fs.readFileSync(userControllerPath, 'utf8');
    const isLoggingSanitized = userControllerContent.includes('const { password: _, token: __, credit_card: ___, ...safeBody } = req.body;') &&
                               userControllerContent.includes('console.log(`[UPDATE USER] ID: ${id}, Body:`, safeBody);');
    console.log(`[2] User Update Logging Sanitized: ${isLoggingSanitized ? '✅ PASS' : '❌ FAIL'}`);

    // 3. Verify Admin Creation Script
    const createAdminPath = path.join(__dirname, '../server/scripts/createAdminPrisma.js');
    const createAdminContent = fs.readFileSync(createAdminPath, 'utf8');
    const enforcedEnvVars = createAdminContent.includes('process.env.ADMIN_EMAIL') &&
                             createAdminContent.includes('process.env.ADMIN_PASSWORD') &&
                             !createAdminContent.includes('|| \'admin@emlak22.com\'');
    console.log(`[3] Admin Creation enforces Env Vars: ${enforcedEnvVars ? '✅ PASS' : '❌ FAIL'}`);

    if (isMigrationSecured && isLoggingSanitized && enforcedEnvVars) {
        console.log('\n✨ ALL SECURITY VERIFICATIONS PASSED ✨');
        process.exit(0);
    } else {
        console.error('\n🚨 SOME SECURITY VERIFICATIONS FAILED 🚨');
        process.exit(1);
    }
}

verifyFixes();
