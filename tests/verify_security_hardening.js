const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'server/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
const EXTENSION_KEY = 'test_ext_key';
const MIGRATION_KEY = 'test_mig_key';

// Mock process.env for the tests
process.env.EXTENSION_KEY = EXTENSION_KEY;
process.env.INTERNAL_MIGRATION_KEY = MIGRATION_KEY;

const adminToken = jwt.sign({ id: 1, email: 'admin@emlak22.com', role: 'admin' }, JWT_SECRET);
const consultantToken = jwt.sign({ id: 2, email: 'consultant@emlak22.com', role: 'consultant' }, JWT_SECRET);

const { authenticateToken, authorizeRole } = require('../server/middleware/authMiddleware');

async function testAuthMiddleware() {
    console.log('--- Testing Auth Middleware ---');

    const reqAdmin = { headers: { authorization: `Bearer ${adminToken}` } };
    const res = { status: (code) => ({ json: (obj) => console.log(`Status: ${code}, Body:`, obj) }), sendStatus: (code) => console.log(`SendStatus: ${code}`) };

    authenticateToken(reqAdmin, res, () => {
        console.log('✅ authenticateToken passed for admin');
        authorizeRole('admin')(reqAdmin, res, () => {
            console.log('✅ authorizeRole(admin) passed for admin');
        });
    });

    const reqConsultant = { headers: { authorization: `Bearer ${consultantToken}` } };
    authenticateToken(reqConsultant, res, () => {
        console.log('✅ authenticateToken passed for consultant');
        authorizeRole('admin')(reqConsultant, res, () => {
            console.log('❌ authorizeRole(admin) SHOULD NOT pass for consultant');
        });
    });
}

async function testEndpoints() {
    console.log('\n--- Testing Endpoints Security (Mocking req/res) ---');

    // 1. Test dealRoutes /internal/migrate
    const dealController = require('../server/controllers/dealController');
    const dealRoutes = require('../server/routes/dealRoutes');

    console.log('\n1. Testing /api/deals/internal/migrate');
    const migrateLayer = dealRoutes.stack.find(l => l.route && l.route.path === '/internal/migrate');
    const migrateMiddlewares = migrateLayer.route.stack.map(s => s.name);
    console.log('Middlewares for /internal/migrate:', migrateMiddlewares);
    if (migrateMiddlewares.includes('authenticateToken') && migrateMiddlewares.includes('<anonymous>')) { // authorizeRole returns anonymous
        console.log('✅ Middlewares correctly applied to /internal/migrate');
    } else {
        console.log('❌ Middlewares NOT correctly applied to /internal/migrate');
    }

    // 2. Test dealController runInternalMigration logic
    console.log('\n2. Testing dealController.runInternalMigration logic');
    const mockRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.data = data; return this; }
    };

    await dealController.runInternalMigration({ query: { key: 'wrong' }, user: { email: 'admin@test.com' } }, mockRes);
    if (mockRes.statusCode === 403) {
        console.log('✅ runInternalMigration rejected wrong key');
    } else {
        console.log('❌ runInternalMigration failed to reject wrong key', mockRes.statusCode);
    }

    await dealController.runInternalMigration({ query: { key: MIGRATION_KEY }, user: { email: 'admin@test.com' } }, mockRes);
    // It will probably fail later because of missing prisma or child_process issues in mock, but we check if it passed the key check
    if (mockRes.statusCode !== 403) {
        console.log('✅ runInternalMigration accepted correct key');
    }

    // 3. Test adminRoutes /stats
    const adminRoutes = require('../server/routes/adminRoutes');
    console.log('\n3. Testing /api/admin/stats');
    const statsLayer = adminRoutes.stack.find(l => l.route && l.route.path === '/stats');
    const statsMiddlewares = statsLayer.route.stack.map(s => s.name);
    console.log('Middlewares for /stats:', statsMiddlewares);
    if (statsMiddlewares.includes('authenticateToken') && statsMiddlewares.includes('<anonymous>')) {
        console.log('✅ Middlewares correctly applied to /stats');
    } else {
        console.log('❌ Middlewares NOT correctly applied to /stats');
    }

    // 4. Test scraperRoutes /import and /finished
    const scraperRoutes = require('../server/routes/scraperRoutes');
    console.log('\n4. Testing /api/scraper/import and /finished');

    // We can't easily test the anonymous handler in the router without executing it,
    // so we'll mock the request and call the handler directly if we can find it,
    // or just rely on manual inspection which we already did.
    // Let's try to find the handler.
    const importLayer = scraperRoutes.stack.find(l => l.route && l.route.path === '/import');
    const importHandler = importLayer.route.stack[0].handle;

    const mockResScraper = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.data = data; return this; },
        ip: '127.0.0.1'
    };

    await importHandler({ headers: { 'x-extension-key': 'wrong' }, ip: '127.0.0.1' }, mockResScraper);
    if (mockResScraper.statusCode === 401) {
        console.log('✅ /import rejected wrong extension key');
    } else {
        console.log('❌ /import failed to reject wrong extension key', mockResScraper.statusCode);
    }

    await importHandler({ headers: { 'x-extension-key': EXTENSION_KEY }, body: { listings: [] } }, mockResScraper);
    if (mockResScraper.statusCode !== 401) {
        console.log('✅ /import accepted correct extension key');
    }
}

async function run() {
    try {
        await testAuthMiddleware();
        await testEndpoints();
    } catch (e) {
        console.error('Test error:', e);
    }
}

run();
