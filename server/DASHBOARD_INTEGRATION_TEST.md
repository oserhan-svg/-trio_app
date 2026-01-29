# Dashboard Integration Test Instructions

## Setup Complete! ✅

SessionManager now automatically saves scraper status to a JSON file that the dashboard can read.

## How It Works

1. **Standalone Script Mode**: When you run `node scripts/test_sahibinden_owner.js`, the SessionManager automatically saves data to:
   ```
   server/browser_data/scraper_status.json
   ```

2. **Dashboard Reads Data**: The API endpoint `/api/scraper/status` checks this JSON file and serves it to the dashboard if it's fresh (< 10 minutes old)

3. **Real-time Updates**: As the scraper runs, stats are updated in the JSON file every time `getStats()` is called

## Testing

### Step 1: Start the Server
```bash
cd server
npm run dev
```

### Step 2: Open Dashboard
Navigate to: **Scraper Operasyon Merkezi** page in the dashboard

### Step 3: Run Test Script (In New Terminal)
```bash
cd server 
node scripts/test_sahibinden_owner.js
```

### Step 4: Watch Dashboard Update
- Dashboard will fetch `/api/scraper/status` every 5-10 seconds
- You should see:
  - Request counts increasing
  - Portal stats populating (Sahibinden)
  - Activity log showing events
  - "Toplam İstek", "Bulunan İlanlar" updating live

## Expected Dashboard Display

```
Scraper Operasyon Merkezi
Son Güncelleme: 22:48:15    v1.3

📊 Toplam İstek: 5
🏢 Bulunan İlanlar: 0 (will increase as listings are found)
✅ Başarı Oranı: %100.0
🛡️ Proxy Sağlığı: 0/100 (disabled)

Platform Durumları:
└── Sahibinden: 5 istek, 0 ilan, 5 başarı, 0 hata

Aktivite Günlüğü:
└── [sahibinden] Sayfa 1 ziyaret ediliyor...
└── [sahibinden] Tarama başlatıldı [residential]
```

## Troubleshooting

**Dashboard shows "Veri Yok":**
- Check if `server/browser_data/scraper_status.json` exists
- Verify server is running on correct port
- Check browser console for API errors
- Manually visit: `http://localhost:5000/api/scraper/status` (with auth token)

**Data is stale:**
- JSON file only considered valid if < 10 minutes old
- Restart test script to generate fresh data

**Script not saving data:**
- Check if `server/browser_data/` directory exists
- Verify SessionManager is being imported correctly in test script
- Look for file permission errors in script output

## File Locations

- **Status JSON**: `server/browser_data/scraper_status.json`  
- **SessionManager**: `server/services/sessionManager.js`
- **API Endpoint**: `server/routes/scraperRoutes.js` (line 99-115)
- **Test Script**: `server/scripts/test_sahibinden_owner.js`

## Next Steps

Test this setup to verify dashboard integration works, then proceed with scraper optimizations testing!
