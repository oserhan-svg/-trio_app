const aiRoutes = require('../routes/aiRoutes');

function inspectRouter() {
    console.log('Inspecting AI Router stacks...');
    const paths = aiRoutes.stack
        .filter(r => r.route)
        .map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);

    console.log('Registered Routes:');
    paths.forEach(p => console.log(` - ${p}`));

    const botStatusExists = paths.some(p => p.includes('/bot/status'));
    const botTriggerExists = paths.some(p => p.includes('/bot/trigger'));

    if (botStatusExists && botTriggerExists) {
        console.log('\nSUCCESS: Bot routes are registered in aiRoutes.js');
    } else {
        console.error('\nFAILURE: Bot routes NOT found in aiRoutes.js');
    }
}

inspectRouter();
