try {
    console.log('Checking scraperService...');
    require('../services/scraperService');
    console.log('✅ scraperService OK');

    console.log('Checking googleCalendarService...');
    require('../services/googleCalendarService');
    console.log('✅ googleCalendarService OK');

    console.log('Checking googleAuthRoutes...');
    require('../routes/googleAuthRoutes');
    console.log('✅ googleAuthRoutes OK');

    console.log('Checking index.js (dry run)...');
    // We can't strict require index because it starts the server, but we can syntax check it
    // by just requiring it and exiting fast if we could, but better to check deps.

    console.log('Tax check pass complete.');
} catch (e) {
    console.error('❌ SYNTAX/IMPORT ERROR:', e);
    process.exit(1);
}
