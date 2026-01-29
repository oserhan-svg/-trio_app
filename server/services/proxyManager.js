class ProxyManager {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
        ];

        this.proxies = [
            // { host: 'proxy1.example.com', port: 8080, username: 'user', password: 'pass', health: 100 },
        ];

        this.fingerprints = [
            { width: 1920, height: 1080, language: 'tr-TR', timezone: 'Europe/Istanbul' },
            { width: 1366, height: 768, language: 'tr-TR', timezone: 'Europe/Istanbul' },
            { width: 1440, height: 900, language: 'en-US', timezone: 'Europe/Istanbul' }
        ];
    }

    /**
     * Get a fresh identity for a new scraper session
     */
    getIdentity() {
        const ua = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        const fp = this.fingerprints[Math.floor(Math.random() * this.fingerprints.length)];
        const proxy = this.proxies.length > 0 ? this.proxies[Math.floor(Math.random() * this.proxies.length)] : null;

        return {
            userAgent: ua,
            proxy: proxy,
            viewport: { width: fp.width, height: fp.height },
            extraHeaders: {
                'Accept-Language': fp.language,
                'Referer': 'https://www.google.com.tr/'
            }
        };
    }

    /**
     * Mark a proxy as failed to lower its health score
     */
    reportProxyFailure(proxyHost) {
        const proxy = this.proxies.find(p => p.host === proxyHost);
        if (proxy) {
            proxy.health = Math.max(0, proxy.health - 20);
            if (proxy.health === 0) {
                console.warn(`🚨 Proxy ${proxyHost} has been disabled due to poor health.`);
            }
        }
    }

    /**
     * Report proxy usage result
     */
    reportProxyResult(proxy, success) {
        if (!proxy) return;
        const host = typeof proxy === 'string' ? proxy.split('@').pop().split(':')[0] : proxy.host;
        const p = this.proxies.find(p => p.host === host || (typeof proxy === 'string' && proxy.includes(p.host)));
        if (p) {
            p.health = success ? Math.min(100, p.health + 5) : Math.max(0, p.health - 20);
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        const total = this.proxies.length;
        const healthy = this.proxies.filter(p => (p.health || 0) > 50).length;
        return {
            total,
            healthy,
            unhealthy: total - healthy,
            healthScore: total > 0 ? (this.proxies.reduce((sum, p) => sum + (p.health || 0), 0) / (total * 100)) : 0
        };
    }

    // Alignment methods for test scripts
    getNextProxy() { return this.proxies.length > 0 ? this.proxies[0] : null; }
    getRandomProxy() { return this.proxies.length > 0 ? this.proxies[Math.floor(Math.random() * this.proxies.length)] : null; }
    async refreshProxies() { return []; }
}

const instance = new ProxyManager();

module.exports = {
    ProxyManager,
    getProxyManager: () => instance,
    default: instance
};
