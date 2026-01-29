const path = require('path');

module.exports = {
    timeouts: {
        pageLoad: 45000, // Optimized from 90s - sufficient for Cloudflare bypass
        element: 20000, // Optimized from 45s - faster failure detection
        navigation: 60000,
        humanDelayMin: 2000, // Optimized from 4s - still human-like but faster
        humanDelayMax: 4000, // Optimized from 8s - balanced speed/stealth
        retryDelay: 3000, // Optimized from 5s - faster retry on failures
        blockWaitFeedbackInterval: 10000, // Show "still waiting" message every 10s during blocks
        warmupDelayMin: 3000, // Optimized from 5s
        warmupDelayMax: 6000, // Optimized from 10s
        afterNavigationDelay: 2000, // Delay after navigation completes
        sideQuestFrequency: 5 // Perform side-quest every N pages (optimized from 2)
    },
    retry: {
        maxPageRetries: 1, // Optimized from 2 - faster failure recovery
        continueOnPageFailure: true, // Continue to next page if one fails
        useExponentialBackoff: true // Use exponential backoff for retries
    },
    paths: {
        cookies: path.join(__dirname, '../browser_data/cookies.json'),
        localStorage: path.join(__dirname, '../browser_data/localStorage.json'),
        userDataDir: path.join(__dirname, '../../chrome-stealth-profile-v4') // Fresh profile v4
    },
    selectors: {
        listingTable: '#searchResultsTable',
        listingRow: '#searchResultsTable tbody tr.searchResultsItem',
        blockIndicators: [
            'Olağan dışı',
            'Olağandışı',
            'erişim tespit',
            'Unusual',
            'Just a moment',
            'Verify you are human',
            'Bir dakika lütfen',
            'Basılı tutun',
            'h-captcha'
        ]
    },
    stealth: {
        rotateUserAgents: true,
        useProxy: false, // DISABLED: Free proxies are typically already blocked by Cloudflare
        proxyUrl: '', // Single proxy (legacy, use proxyManager instead)
        proxyList: [
            // Static proxy list (legacy)
            // 'http://user:pass@ip:port',
        ],
        maxRetries: 3,
        // NEW: Proxy Manager Configuration
        proxyManager: {
            enabled: false, // DISABLED: Free proxies cause more Cloudflare blocks than they solve
            webshareApiKey: process.env.WEBSHARE_API_KEY || null, // Get free 10 proxies: https://www.webshare.io/
            enableProxyScrape: true,  // Free unlimited proxies (lower quality)
            enableFreeProxyList: true, // Free proxies from free-proxy-list.net
            minHealthScore: 0.5, // Minimum 50% success rate to keep proxy
            healthCheckInterval: 5 * 60 * 1000, // Health check every 5 minutes
            enableHealthCheck: true, // Perform automatic health checks
            rotationStrategy: 'round-robin', // 'round-robin' or 'random'
        }
    },
    // New Configs
    agencyStore: {
        url: 'https://trioemlakvegayrimenkul.sahibinden.com/',
        hepsiemlak_url: 'https://www.hepsiemlak.com/emlak-ofisi/trio-emlak-gayrimenkul-danismanlik-138391',
        hepsiemlak_consultants: [
            { name: 'Arzu Serhan', url: 'https://www.hepsiemlak.com/emlak-ofisi/trio-emlak-gayrimenkul-danismanlik-138391/arzu-serhan-4315370' },
            { name: 'Kanat Kubat', url: 'https://www.hepsiemlak.com/emlak-ofisi/trio-emlak-gayrimenkul-danismanlik-138391/kanat-kubat-3819248' },
            { name: 'Ozancan Serhan', url: 'https://www.hepsiemlak.com/emlak-ofisi/trio-emlak-gayrimenkul-danismanlik-138391/ozancan-serhan-3819064' }
        ],
        assignedUserId: 3 // Admin (Verified)
    },
    ownerFilters: {
        sahibinden: 'a5_min=1&a5_max=1', // Sahibinden Bireysel Filter
        hepsiemlak: 'sahibinden=true',   // Hepsiemlak Owner Filter
        emlakjet: 'listing_owner=individual'
    },
    pagination: {
        sahibinden: 20,
        hepsiemlak: 50,
        emlakjet: 50
    }
};
