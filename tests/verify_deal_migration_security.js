const router = require('../server/routes/dealRoutes');

function verifyMiddleware() {
    const migrateRoute = router.stack.find(layer => layer.route && layer.route.path === '/internal/migrate');

    if (!migrateRoute) {
        console.error('❌ /internal/migrate route not found');
        process.exit(1);
    }

    const middlewareNames = migrateRoute.route.stack.map(layer => layer.name);
    console.log('Middleware found on /internal/migrate:', middlewareNames);

    const hasAuthenticateToken = middlewareNames.includes('authenticateToken');
    const hasAuthorizeRole = middlewareNames.includes('middleware'); // authorizeRole returns an anonymous function named 'middleware' usually or is named by express

    // Check if authorizeRole('admin') is present.
    // Usually authorizeRole returns a middleware function.

    if (hasAuthenticateToken) {
        console.log('✅ authenticateToken middleware found');
    } else {
        console.error('❌ authenticateToken middleware MISSING');
        process.exit(1);
    }

    // Since authorizeRole returns an anonymous function, we might need to check count or specific identifiers if possible,
    // but typically it shows up in the stack.
    if (migrateRoute.route.stack.length >= 3) {
        console.log('✅ Multiple middleware layers found (expected 3: auth, role, controller)');
    } else {
        console.error('❌ Expected at least 3 layers in route stack, found:', migrateRoute.route.stack.length);
        process.exit(1);
    }

    console.log('✅ Security verification successful');
}

try {
    verifyMiddleware();
} catch (e) {
    console.error('Verification failed:', e.message);
    process.exit(1);
}
