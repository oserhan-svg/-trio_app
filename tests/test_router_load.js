const path = require('path');
// Mock dependencies that might fail outside the server environment
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

try {
    const routerPath = path.join(__dirname, '../server/routes/dealRoutes');
    const router = require(routerPath);
    console.log('✅ dealRoutes.js loaded successfully. Imports are correct.');
} catch (error) {
    console.error('❌ Failed to load dealRoutes.js:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
}
