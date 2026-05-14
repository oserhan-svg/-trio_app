const fs = require('fs');
const path = require('path');

async function verifySecurityFix() {
    console.log('🔍 Starting Security Verification...');

    const routesFile = path.join(__dirname, '../server/routes/dealRoutes.js');
    const controllerFile = path.join(__dirname, '../server/controllers/dealController.js');

    // 1. Verify Routes
    console.log('Checking dealRoutes.js for authentication middleware...');
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    const hasAuth = routesContent.includes("router.post('/internal/migrate', authenticateToken, authorizeRole('admin')");

    if (hasAuth) {
        console.log('✅ PASS: Authentication middleware and POST method applied to /internal/migrate');
    } else {
        console.error('❌ FAIL: Authentication middleware or POST method MISSING in dealRoutes.js');
        process.exit(1);
    }

    // 2. Verify Controller Logic
    console.log('Checking dealController.js for header check logic...');
    const controllerContent = fs.readFileSync(controllerFile, 'utf8');
    const hasHeaderCheck = controllerContent.includes("req.headers['x-internal-migration-key']") &&
                           controllerContent.includes("process.env.INTERNAL_MIGRATION_KEY");

    if (hasHeaderCheck) {
        console.log('✅ PASS: Secondary header check logic applied to runInternalMigration');
    } else {
        console.error('❌ FAIL: Secondary header check logic MISSING in dealController.js');
        process.exit(1);
    }

    console.log('\n✨ Security Verification Successful!');
}

verifySecurityFix().catch(err => {
    console.error('Verification failed with error:', err);
    process.exit(1);
});
