const service = require('../services/scraperService');

// The new function has a check for 'sahibinden.com' at the very beginning.
// We can't easily inspect the function body, but we can check if it's NOT the old one.
// The old one was named scrapeSingleListing in the file but exported as scrapeDetails.
// The new one is named scrapeDetails.

console.log('Exported scrapeDetails name:', service.scrapeDetails.name);

if (service.scrapeDetails.name === 'scrapeDetails') {
    console.log('✅ PASS: Exported function is the correct "scrapeDetails".');
} else if (service.scrapeDetails.name === 'scrapeSingleListing') {
    console.log('❌ FAIL: Exported function is still "scrapeSingleListing".');
} else {
    console.log(`❓ UNKNOWN: Exported function name is "${service.scrapeDetails.name}".`);
}
