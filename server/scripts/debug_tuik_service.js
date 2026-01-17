const { fetchRentalRate } = require('../services/tuikService');

(async () => {
    try {
        console.log('Testing fetchRentalRate...');
        const data = await fetchRentalRate();
        console.log('Result type:', typeof data);
        console.log('Is Array?', Array.isArray(data));
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
})();
