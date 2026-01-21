const path = require('path');

module.exports = {
    timeouts: {
        pageLoad: 90000,
        element: 30000,
        navigation: 60000,
        humanDelayMin: 2000,
        humanDelayMax: 5000
    },
    paths: {
        cookies: path.join(__dirname, '../browser_data/cookies.json'),
        localStorage: path.join(__dirname, '../browser_data/localStorage.json'),
        userDataDir: path.join(__dirname, '../../chrome-stealth-profile-v2')
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
        useProxy: false,
        proxyUrl: '',
        proxyList: [
            // 'http://user:pass@ip:port',
            // 'http://ip:port'
        ],
        maxRetries: 3
    }
};
