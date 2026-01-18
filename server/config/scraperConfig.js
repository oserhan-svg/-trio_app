const path = require('path');

module.exports = {
    timeouts: {
        pageLoad: 60000,
        element: 15000,
        navigation: 30000,
        humanDelayMin: 2000,
        humanDelayMax: 5000
    },
    paths: {
        cookies: path.join(__dirname, '../browser_data/cookies.json'),
        localStorage: path.join(__dirname, '../browser_data/localStorage.json'),
        userDataDir: path.join(__dirname, '../../chrome-stealth-profile')
    },
    selectors: {
        listingTable: '#searchResultsTable',
        listingRow: '#searchResultsTable tbody tr.searchResultsItem',
        blockIndicators: [
            'Olağan dışı',
            'Unusual',
            'Just a moment',
            'Verify you are human',
            'Basılı tutun',
            'h-captcha'
        ]
    },
    stealth: {
        rotateUserAgents: true,
        useProxy: false, // Proxy kullanmak için bunu true yapın
        proxyUrl: '', // Örn: 'http://user:pass@ip:port' veya 'http://ip:port'
        maxRetries: 3
    }
};
