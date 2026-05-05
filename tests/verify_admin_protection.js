/**
 * Verification script for Admin Stats route protection
 */
const adminRouter = require('../server/routes/adminRoutes');

function checkAdminStatsProtection() {
    console.log('🔍 Checking protection for /api/admin/stats...');

    // Express routers have a stack property
    const statsRoute = adminRouter.stack.find(layer =>
        layer.route && layer.route.path === '/stats'
    );

    if (!statsRoute) {
        console.error('❌ Could not find /stats route in adminRouter');
        process.exit(1);
    }

    const middlewareNames = statsRoute.route.stack.map(layer => layer.name);
    console.log('   Middleware found:', middlewareNames.join(', '));

    const hasAuthenticateToken = middlewareNames.includes('authenticateToken');
    const hasAuthorizeRole = middlewareNames.includes('authorizeRole') || middlewareNames.includes('<anonymous>'); // authorizeRole returns a wrapper

    // Since authorizeRole('admin') returns an anonymous function, we might need a more robust check
    // but usually in Express the name shows up as 'authorizeRole' if it's not a wrapper,
    // or we can check the source if needed.

    // Let's inspect the functions themselves if possible
    const isAuthorizeRolePresent = statsRoute.route.stack.some(layer => {
        const fnStr = layer.handle.toString();
        return fnStr.includes('req.user.role !== role') || fnStr.includes('authorizeRole');
    });

    if (hasAuthenticateToken && isAuthorizeRolePresent) {
        console.log('✅ /api/admin/stats is properly protected with authenticateToken and authorizeRole');
    } else {
        if (!hasAuthenticateToken) console.error('❌ Missing authenticateToken middleware');
        if (!isAuthorizeRolePresent) console.error('❌ Missing authorizeRole middleware');
        process.exit(1);
    }
}

try {
    checkAdminStatsProtection();
} catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
}
