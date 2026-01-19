try {
    const service = require('../services/analyticsService');
    console.log('Exports:', Object.keys(service));

    if (typeof service.getNeighborhoodStatsMap === 'function') {
        console.log('✅ getNeighborhoodStatsMap is a function');
    } else {
        console.error('❌ getNeighborhoodStatsMap is MISSING or not a function');
    }
} catch (e) {
    console.error('Error loading service:', e);
}
