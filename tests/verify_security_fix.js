const fs = require('fs');
const path = require('path');

function verifyFix() {
    const routePath = path.join(__dirname, '../server/routes/dealRoutes.js');
    const controllerPath = path.join(__dirname, '../server/controllers/dealController.js');

    const routeContent = fs.readFileSync(routePath, 'utf8');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    console.log('--- Verification Report ---');

    // 1. Check Route Method, Middleware and Import
    const importMatch = routeContent.includes("const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');");
    const routeMatch = routeContent.includes("router.post('/internal/migrate', authenticateToken, authorizeRole('admin'), dealController.runInternalMigration);");

    if (importMatch) {
        console.log('✅ authorizeRole is correctly imported in dealRoutes.js');
    } else {
        console.error('❌ authorizeRole is NOT imported in dealRoutes.js');
    }

    if (routeMatch) {
        console.log('✅ Route is now POST and has authenticateToken, authorizeRole(\'admin\')');
    } else {
        console.error('❌ Route verification failed!');
    }

    // 2. Check Controller Header Validation
    const headerCheck = controllerContent.includes("const migrationKey = req.headers['x-internal-migration-key'];");
    const comparisonCheck = controllerContent.includes("if (!migrationKey || migrationKey !== process.env.INTERNAL_MIGRATION_KEY)");

    if (headerCheck && comparisonCheck) {
        console.log('✅ Controller now validates x-internal-migration-key header');
    } else {
        console.error('❌ Controller verification failed!');
    }

    if (importMatch && routeMatch && headerCheck && comparisonCheck) {
        console.log('\n✨ All security checks PASSED.');
    } else {
        console.error('\n🛑 Some checks FAILED.');
        process.exit(1);
    }
}

verifyFix();
