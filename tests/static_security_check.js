const fs = require('fs');
const path = require('path');

function checkFile(filepath, patterns) {
    console.log(`Checking ${filepath}...`);
    const content = fs.readFileSync(filepath, 'utf8');
    patterns.forEach(pattern => {
        if (content.includes(pattern)) {
            console.log(`✅ Found: ${pattern}`);
        } else {
            console.log(`❌ NOT FOUND: ${pattern}`);
            process.exit(1);
        }
    });
}

// 1. dealRoutes.js
checkFile('server/routes/dealRoutes.js', [
    "router.get('/internal/migrate', authenticateToken, authorizeRole('admin'), dealController.runInternalMigration);"
]);

// 2. dealController.js
checkFile('server/controllers/dealController.js', [
    "if (!process.env.INTERNAL_MIGRATION_KEY || key !== process.env.INTERNAL_MIGRATION_KEY)"
]);

// 3. createAdminPrisma.js
checkFile('server/scripts/createAdminPrisma.js', [
    "const password = process.env.ADMIN_PASSWORD || '1234_SET_ME_IN_ENV';",
    "update: {",
    "role: 'admin'",
    "},"
]);

// Check that password_hash is NOT in update block
const createAdminContent = fs.readFileSync('server/scripts/createAdminPrisma.js', 'utf8');
const updateBlock = createAdminContent.match(/update: \{([\s\S]*?)\}/)[1];
if (updateBlock.includes('password_hash')) {
    console.log('❌ password_hash still in update block!');
    process.exit(1);
} else {
    console.log('✅ password_hash removed from update block');
}

// 4. adminRoutes.js
checkFile('server/routes/adminRoutes.js', [
    "router.get('/stats', authenticateToken, authorizeRole('admin'), getDashboardStats);"
]);

// 5. scraperRoutes.js
checkFile('server/routes/scraperRoutes.js', [
    "const extensionKey = req.headers['x-extension-key'];",
    "if (!process.env.EXTENSION_KEY || extensionKey !== process.env.EXTENSION_KEY)"
]);

console.log('\n✨ All static security checks passed!');
