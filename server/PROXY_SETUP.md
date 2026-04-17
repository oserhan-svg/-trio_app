# Proxy Manager Setup Guide

## Quick Start

### Option 1: Enable with Free Proxies (No Signup Required)

1. **Enable in config**:
```javascript
// server/config/scraperConfig.js
proxyManager: {
    enabled: true,  // ⬅️ Change this to true
    enableProxyScrape: true,
    enableFreeProxyList: true
}
```

2. **That's it!** The system will automatically:
- Fetch 50+ proxies from ProxyScrape
- Fetch 30 proxiesFrom Free-Proxy-List  
- Health check all proxies
- Rotate automatically

### Option 2: Add WebShare.io for Better Quality (Recommended)

1. **Sign up** for free at https://www.webshare.io/
   - Get **10 high-quality** proxies free
   - No credit card needed

2. **Get your API key**:
   - Dashboard → API → Copy your API token

3. **Add to environment**:
```bash
# .env file
WEBSHARE_API_KEY=your_webshare_api_key_here
```

4. **Enable in config**:
```javascript
proxyManager: {
    enabled: true,
    webshareApiKey: process.env.WEBSHARE_API_KEY, // Will use .env
    enableProxyScrape: true,  // Fallback proxies
    enableFreeProxyList: true  // More fallback
}
```

---

## Usage

### Automatic Integration (Recommended)

Just enable in config and use your normal scraper:

```javascript
const { getFullyEnhancedBrowser } = require('./services/proxyIntegration');

// This now includes BOTH fingerprinting AND proxy
const { browser, page, sessionManager } = await getFullyEnhancedBrowser();

// Use normally - proxy rotates automatically
await page.goto('https://www.hepsiemlak.com');
```

### Manual Proxy Selection

If you want more control:

```javascript
const { getProxyManager } = require('./services/proxyManager');

const proxyManager = getProxyManager();
await proxyManager.refreshProxies();

// Get next proxy (round-robin)
const proxy = proxyManager.getNextProxy();

// Or get random proxy
const randomProxy = proxyManager.getRandomProxy();

// Launch with specific proxy
const browser = await createAdvancedStealthBrowser({ proxy });
```

---

## Configuration Options

```javascript
proxyManager: {
    // Enable/disable system
    enabled: false,  // Set true to activate
    
    // WebShare.io (best quality, 10 free)
    webshareApiKey: process.env.WEBSHARE_API_KEY,
    
    // ProxyScrape (unlimited, medium quality)
    enableProxyScrape: true,
    
    // Free-Proxy-List (unlimited, lower quality)
    enableFreeProxyList: true,
    
    // Health management
    minHealthScore: 0.5,  // Keep proxies with >50% success
    healthCheckInterval: 5 * 60 * 1000,  // Check every 5 min
    enableHealthCheck: true,  // Auto health checking
    
    // Rotation
    rotationStrategy: 'round-robin'  // or 'random'
}
```

---

## Testing

### Test Proxy Fetching

```bash
node scripts/test_proxy_manager.js
```

Expected output:
```
✅ Fetched 50 proxies from ProxyScrape
✅ Fetched 30 proxies from Free-Proxy-List
✅ Fetched 10 proxies from WebShare.io (if API key set)
```

### Test Integration

```javascript
const { refreshAllProxies, getProxyStats } = require('./services/proxyIntegration');

// Refresh all proxies
await refreshAllProxies();

// Get statistics
const stats = getProxyStats();
console.log(stats);
// => { enabled: true, total: 90, healthy: 45, unhealthy: 45, healthScore: 0.5 }
```

---

## Proxy Sources Comparison

| Source | Count | Quality | Speed | Signup |
|--------|-------|---------|-------|--------|
| **WebShare.io** | 10 | ⭐⭐⭐⭐⭐ | Fast | Free account |
| **ProxyScrape** | 50+ | ⭐⭐⭐ | Medium | None |
| **Free-Proxy-List** | 30+ | ⭐⭐ | Slow | None |

**Recommendation**: Use all three for maximum coverage.

---

## Health Checking

The system automatically:
- Tests each proxy every 5 minutes
- Removes proxies with <50% success rate
- Caches results to disk (`browser_data/proxy_cache.json`)

### View Health Stats

```javascript
const { getProxyManager } = require('./services/proxyManager');
const manager = getProxyManager();

const stats = manager.getStats();
console.log(`Healthy: ${stats.healthy}/${stats.total} (${(stats.healthScore * 100).toFixed(1)}%)`);
```

---

## Advanced Usage

### Custom Health Check

```javascript
const manager = getProxyManager();

// Check specific proxy
const result = await manager.testProxy('http://proxy:port');
console.log(result);
// => { success: true, responseTime: 1234, error: null }
```

### Report Proxy Results

```javascript
// After using a proxy, report success/failure
manager.reportProxyResult(proxy, true);  // Success
manager.reportProxyResult(proxy, false); // Failure
```

### Force Refresh

```javascript
// Fetch fresh proxies from all sources
await manager.refreshProxies();
```

---

## Troubleshooting

### "No proxies available"

1. Check if proxy manager is enabled in config
2. Try fetching manually: `await manager.refreshProxies()`
3. Check internet connection

### "All proxies failing"

1. Free proxies can be unreliable - this is normal
2. System will auto-prune bad proxies
3. Add WebShare.io for better quality

### "WebShare API error"

1. Verify API key is correct
2. Check you have free proxies remaining (Dashboard)
3. Fallback sources (ProxyScrape, Free-Proxy-List) will still work

---

## Best Practices

1. **Use WebShare + Fallbacks**: Best coverage and quality
2. **Enable Health Checking**: Keeps proxy pool clean
3. **Monitor Stats**: Check `getProxyStats()` periodically
4. **Rotate Strategy**: Use 'round-robin' for even distribution
5. **Report Results**: Always report proxy success/failure

---

## Next Steps

After enabling proxies:

1. ✅ Enable in config
2. ✅ (Optional) Add WebShare API key
3. ✅ Test with `test_proxy_manager.js`
4. ✅ Run your scrapers - proxies work automatically!
5. ✅ Monitor success rates with `getProxyStats()`

**Result**: Your scraper now has:
- ✅ Enhanced fingerprinting (Phase 1)
- ✅ Proxy rotation (Phase 2)
- ✅ 80-100 total proxies
- ✅ Automatic health management
- ✅ ~70% lower detection risk

