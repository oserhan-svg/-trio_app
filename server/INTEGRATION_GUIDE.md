# 🚀 Mevcut Scraper'ınızı Güncelleme Rehberi

## Hızlı Entegrasyon (5 Dakika)

Mevcut `scraperService.js` dosyanızı enhanced hale getirmek için:

### Seçenek 1: Minimal Değişiklik (Sadece Fingerprinting)

`scraperService.js` dosyanızda scrapeHepsiemlak fonksiyonunu bulun ve şu değişiklikleri yapın:

**ÖNCESİ:**
```javascript
async function scrapeHepsiemlak(page, url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3]) {
    // Mevcut kodunuz...
}
```

**SONRASI:**
```javascript
// Dosyanın başına ekleyin
const { addEnhancedHumanBehavior } = require('./enhancedScraperUtils');

async function scrapeHepsiemlak(page, url, forcedSellerType = null, category = 'residential', targetPages = [1, 2, 3]) {
    // Enhanced behavior'ı ekleyin
    await addEnhancedHumanBehavior(page);
    
    // Artık page.randomWait(), page.simulateReading() gibi methodlar kullanılabilir
    // Mevcut kodunuz devam eder...
}
```

### Seçenek 2: Full Enhancement (Fingerprinting + Proxy)

`scraperService.js` içinde `scrapeProperties` fonksiyonunu güncelleyin:

**ÖNCESİ:**
```javascript
async function scrapeProperties(provider = 'all', injectedPage = null) {
    let browser, page;
    try {
        if (injectedPage) {
            page = injectedPage;
            browser = page.browser();
        } else {
            const { launchRealBrowser } = require('./realBrowser');
            const { browser: rb, page: rp } = await launchRealBrowser();
            browser = rb;
            page = rp;
        }
    }
    // ...
}
```

**SONRASI:**
```javascript
// Dosyanın başına ekleyin
const { getFullyEnhancedBrowser } = require('./proxyIntegration');
const { getSessionManager } = require('./sessionManager');

async function scrapeProperties(provider = 'all', injectedPage = null) {
    let browser, page, sessionManager;
    try {
        if (injectedPage) {
            page = injectedPage;
            browser = page.browser();
            sessionManager = getSessionManager();
        } else {
            // DEĞIŞEN SATIR - Enhanced browser kullan
            const enhanced = await getFullyEnhancedBrowser();
            browser = enhanced.browser;
            page = enhanced.page;
            sessionManager = enhanced.sessionManager;
        }
        
        // Her scrape sonrası success tracking ekleyin
        // sessionManager.trackRequest(true);  // Success durumunda
        // sessionManager.trackRequest(false); // Failure durumunda
    }
    // ...
}
```

---

## Adım Adım Entegrasyon

### Adım 1: Import'ları Ekleyin

`scraperService.js` dosyasının başına ekleyin:

```javascript
// Enhanced scraping modules
const { getFullyEnhancedBrowser } = require('./proxyIntegration');
const { getSessionManager } = require('./sessionManager');
const { getAdaptiveDelay } = require('./enhancedScraperUtils');
const { isOptimalScrapingTime } = require('./temporalDelays');
```

### Adım 2: Browser Launch'ı Güncelleyin

`scrapeProperties` fonksiyonunda browser launch kısmını değiştirin:

```javascript
// ESKİ:
// const { launchRealBrowser } = require('./realBrowser');
// const { browser, page } = await launchRealBrowser();

// YENİ:
const { browser, page, sessionManager } = await getFullyEnhancedBrowser();
```

### Adım 3: Success Tracking Ekleyin

Her scrape işleminden sonra:

```javascript
try {
    // Scraping işleminiz...
    await scrapeHepsiemlak(page, url, ...);
    
    // Success tracking
    sessionManager.trackRequest(true);
    
} catch (error) {
    // Error tracking
    sessionManager.trackRequest(false);
    console.error('Scrape failed:', error);
}
```

### Adım 4: Adaptive Delays Kullanın

Sabit delayler yerine adaptive kullanın:

```javascript
// ESKİ:
// await new Promise(r => setTimeout(r, 5000));

// YENİ:
const baseDelay = 5000;
const adaptiveDelay = getAdaptiveDelay(baseDelay);
await new Promise(r => setTimeout(r, adaptiveDelay));
```

### Adım 5: Enhanced Page Methods

Scrape sırasında enhanced methodları kullanın:

```javascript
// Navigate
await page.goto(url, { waitUntil: 'domcontentloaded' });

// Reading simulation
await page.simulateReading('medium');

// Random scroll
await page.randomScroll();

// Page transition
await page.waitForPageTransition();
```

---

## Örnek: SaveListings'e Tracking Eklemek

`saveListings` fonksiyonunu güncelleyin:

```javascript
async function saveListings(listings) {
    if (listings.length === 0) return;
    
    const sessionManager = getSessionManager();
    
    for (const item of listings) {
        try {
            // Mevcut save logic...
            await prisma.property.create({ data: item });
            
            // Track success
            sessionManager.trackRequest(true);
            
        } catch (dbErr) {
            // Track failure
            sessionManager.trackRequest(false);
            console.error('Save failed:', dbErr);
        }
    }
}
```

---

## Config Ayarları

### 1. Sadece Enhanced Fingerprinting

```javascript
// scraperConfig.js - Hiçbir değişiklik gerekmez!
// Zaten aktif
```

### 2. Proxy'leri Aktifleştir

```javascript
// scraperConfig.js
stealth: {
    proxyManager: {
        enabled: true,  // ⬅️ Bunu true yapın
        enableProxyScrape: true,
        enableFreeProxyList: true
    }
}
```

### 3. WebShare.io Ekle (Önerilen)

```bash
# .env dosyasına ekleyin
WEBSHARE_API_KEY=your_api_key_here
```

```javascript
// scraperConfig.js - Otomatik çalışır
proxyManager: {
    enabled: true,
    webshareApiKey: process.env.WEBSHARE_API_KEY,  // .env'den okur
}
```

---

## Test & Validate

### 1. Test Et

```bash
# Enhanced features test
node scripts/test_enhanced_scraping.js

# Proxy test (eğer aktifse)
node scripts/test_proxy_manager.js

# Full demo
node scripts/enhanced_scraper_demo.js
```

### 2. Gerçek Scraper'ı Çalıştır

```javascript
// Örnek: Portfolio sync
const { syncPortfolio } = require('./services/scraperService');
await syncPortfolio();
```

### 3. Stats Kontrol Et

```javascript
const { getSessionManager } = require('./services/sessionManager');
const sessionManager = getSessionManager();

const stats = sessionManager.getStats();
console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
console.log(`Total Requests: ${stats.requestCount}`);
```

---

## Yaygın Senaryolar

### Scenario 1: Interactive Scraping (injectedPage)

Eğer interactive mode kullanıyorsanız:

```javascript
async function scrapeProperties(provider = 'all', injectedPage = null) {
    let sessionManager = getSessionManager();
    
    if (injectedPage) {
        // Injected page'e enhanced behavior ekle
        const { addEnhancedHumanBehavior } = require('./enhancedScraperUtils');
        await addEnhancedHumanBehavior(injectedPage);
        
        // Use normally
        await injectedPage.simulateReading();
    }
}
```

### Scenario 2: Manual Trigger Endpoints

WhatsApp routes gibi manual trigger'lar için:

```javascript
// whatsappRoutes.js
router.post('/trigger-scrape', async (req, res) => {
    const { getFullyEnhancedBrowser } = require('../services/proxyIntegration');
    
    const { browser, page, sessionManager } = await getFullyEnhancedBrowser();
    
    // Scrape...
    
    const stats = sessionManager.getStats();
    res.json({ success: true, stats });
});
```

### Scenario 3: Scheduled Scraping

Cron jobs için:

```javascript
// Optimal time check ekleyin
const { isOptimalScrapingTime } = require('./services/temporalDelays');

cron.schedule('0 */6 * * *', async () => {
    if (!isOptimalScrapingTime()) {
        console.log('⏰ Not optimal time, skipping...');
        return;
    }
    
    await scrapeProperties('all');
});
```

---

## Rollback Plan

Eğer sorun olursa, geri almak çok kolay:

```javascript
// Enhanced'dan geri dön
// const { getFullyEnhancedBrowser } = require('./proxyIntegration');
// const { browser, page } = await getFullyEnhancedBrowser();

// Eski usul
const { launchRealBrowser } = require('./realBrowser');
const { browser, page } = await launchRealBrowser();
```

Config'te de disable etmek yeterli:
```javascript
proxyManager: { enabled: false }
```

---

## Checklist

Entegrasyonu tamamladıktan sonra kontrol edin:

- [ ] Enhanced browser kullanıyor musunuz? (`getFullyEnhancedBrowser`)
- [ ] Session tracking eklediniz mi? (`sessionManager.trackRequest`)
- [ ] Enhanced page methods kullanıyor musunuz? (`simulateReading`, `waitForPageTransition`)
- [ ] Config'te proxy ayarlarını yaptınız mı?
- [ ] Test scriptlerini çalıştırdınız mı?
- [ ] Stats monitörlüyorsunuz musunuz?

---

## Sonraki Adımlar

1. ✅ Minimal entegrasyon yapın (1 satır değişiklik)
2. ✅ Test edin
3. ✅ Stats takip edin
4. ✅ Proxy ekleyin (opsiyonel)
5. ✅ Production'a deploy edin

**Başarılar!** 🎉
