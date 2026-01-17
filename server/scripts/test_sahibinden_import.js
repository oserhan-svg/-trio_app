const { scrapeSahibindenDetails } = require('./services/stealthScraper');

console.log('Type of scrapeSahibindenDetails:', typeof scrapeSahibindenDetails);

if (typeof scrapeSahibindenDetails === 'function') {
    console.log('SUCCESS: Function is imported correctly.');
} else {
    console.log('FAIL: Function is NOT imported correctly.');
}
