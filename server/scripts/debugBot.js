const DeveloperBotService = require('../services/DeveloperBotService');

async function debug() {
    console.log('Starting Debug Run...');
    try {
        const result = await DeveloperBotService.runContinuousTests();
        console.log('Result:', result);
    } catch (error) {
        console.error('CRITICAL ERROR CAUGHT:');
        console.error(error);
        if (error.stack) console.error(error.stack);
    }
}

debug();
