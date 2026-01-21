try {
    console.log('Attempting to require scraperService...');
    const service = require('../services/scraperService');
    console.log('✅ scraperService loaded successfully.');
    if (typeof service.scrapeProperties === 'function') {
        console.log('✅ scrapeProperties is a function.');
    } else {
        console.error('❌ scrapeProperties is NOT a function.');
    }
} catch (e) {
    console.error('❌ Failed to load scraperService:', e);
    console.error(e.stack);
}
