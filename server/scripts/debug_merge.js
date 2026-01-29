const fs = require('fs');
const path = require('path');

// Mock Session Stats (representing a fresh start)
let sessionStats = {
    requestCount: 0,
    portalStats: {
        sahibinden: { requestCount: 0, listingCount: 0 },
        hepsiemlak: { requestCount: 0, listingCount: 0 },
        emlakjet: { requestCount: 0, listingCount: 0 }
    },
    recentEvents: []
};

// Mock Status File Data
const standaloneData = {
    requestCount: 26,
    portalStats: {
        sahibinden: { requestCount: 21, listingCount: 435 },
        hepsiemlak: { requestCount: 2, listingCount: 46 },
        emlakjet: { requestCount: 3, listingCount: 90 }
    },
    recentEvents: [{ id: 1, message: 'Test' }]
};

console.log('--- BEFORE MERGE ---');
console.log('Emlakjet Listings:', sessionStats.portalStats.emlakjet.listingCount);

const MAX_AGE = 24 * 60 * 60 * 1000;
const dataAge = 1000; // Mock 1 second old

if (dataAge < MAX_AGE) {
    const isSessionEmpty = (sessionStats.requestCount || 0) === 0;

    if (isSessionEmpty) {
        console.log('Session is empty. Using standaloneData completely.');
        sessionStats = standaloneData;
    } else {
        console.log('Session is not empty. Merging...');
        const mergedPortalStats = { ...sessionStats.portalStats };
        Object.keys(standaloneData.portalStats || {}).forEach(portal => {
            const localPortal = mergedPortalStats[portal];
            const savedPortal = standaloneData.portalStats[portal];
            if (savedPortal && (savedPortal.listingCount || 0) > 0) {
                if (!localPortal || (localPortal.listingCount || 0) === 0) {
                    mergedPortalStats[portal] = savedPortal;
                }
            }
        });
        sessionStats.portalStats = mergedPortalStats;
    }
}

console.log('--- AFTER MERGE ---');
console.log('Emlakjet Listings:', sessionStats.portalStats.emlakjet.listingCount);
console.log('Portal Keys:', Object.keys(sessionStats.portalStats));
