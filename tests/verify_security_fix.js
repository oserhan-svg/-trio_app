const fs = require('fs');
const path = require('path');

function verify() {
    console.log('🛡️ Starting Security Verification...');

    // 1. Check userController.js for sanitized logging
    const userControllerPath = path.join(__dirname, '../server/controllers/userController.js');
    const userControllerContent = fs.readFileSync(userControllerPath, 'utf8');

    const problematicUserLog = 'console.log(`[UPDATE USER] ID: ${id}, Body:`, req.body);';
    if (userControllerContent.includes(problematicUserLog)) {
        console.error('❌ FAILURE: userController.js still contains unsanitized req.body logging.');
        process.exit(1);
    }

    const sanitizedUserLog = 'console.log(`[UPDATE USER] ID: ${id}, Body:`, logBody);';
    if (!userControllerContent.includes(sanitizedUserLog)) {
        console.error('❌ FAILURE: userController.js does not contain expected sanitized logging logic.');
        process.exit(1);
    }
    console.log('✅ userController.js sanitization verified.');

    // 2. Check clientPropertyController.js for removed debug logging
    const clientPropertyControllerPath = path.join(__dirname, '../server/controllers/clientPropertyController.js');
    const clientPropertyControllerContent = fs.readFileSync(clientPropertyControllerPath, 'utf8');

    const problematicClientLog = 'debug_params_absolute.txt';
    if (clientPropertyControllerContent.includes(problematicClientLog)) {
        console.error('❌ FAILURE: clientPropertyController.js still contains debug_params_absolute.txt reference.');
        process.exit(1);
    }
    console.log('✅ clientPropertyController.js insecure logging removal verified.');

    console.log('🛡️ All Security Verifications Passed!');
}

verify();
