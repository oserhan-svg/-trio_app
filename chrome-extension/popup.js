const PORTAL_URLS = {
    sahibinden_sale: 'https://www.sahibinden.com/satilik/balikesir-ayvalik?a5_min=1&a5_max=1',
    sahibinden_rent: 'https://www.sahibinden.com/kiralik/balikesir-ayvalik?a5_min=1&a5_max=1',
    hepsiemlak_sale: 'https://www.hepsiemlak.com/ayvalik-satilik?sahibinden=true',
    hepsiemlak_rent: 'https://www.hepsiemlak.com/ayvalik-kiralik?sahibinden=true',
    emlakjet_sale: 'https://www.emlakjet.com/satilik-konut/balikesir-ayvalik/sahibinden/',
    emlakjet_rent: 'https://www.emlakjet.com/kiralik-konut/balikesir-ayvalik/sahibinden/',
    whatsapp: 'https://web.whatsapp.com/'
};

function updateUI() {
    chrome.storage.local.get(['is_running', 'scraped_count', 'page_count', 'last_status'], (data) => {
        document.getElementById('countVal').innerText = data.scraped_count || 0;
        document.getElementById('pageVal').innerText = data.page_count || 0;
        const statusEl = document.getElementById('status');

        if (data.is_running) {
            statusEl.innerText = data.last_status || "Çalışıyor...";
            statusEl.className = "text-emerald-400 font-bold animate-pulse";
        } else {
            statusEl.innerText = data.last_status || "Hazır...";
            statusEl.className = "text-slate-400";
        }
    });
}

/**
 * Universal launcher that delegates to background (prevents popup closing death)
 */
function launchPortals(urls) {
    document.getElementById('status').innerText = "⏳ Başlatılıyor...";

    // Delegate to Background Worker
    chrome.runtime.sendMessage({
        action: "launch_portals",
        urls: urls
    }, (response) => {
        // Only close after we get a confirmation (or undefined if fire-and-forget, but callback ensures send)
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            document.getElementById('status').innerText = "❌ Hata Oluştu";
            return;
        }

        document.getElementById('status').innerText = "▶ Komut İletildi";
        setTimeout(() => window.close(), 1000);
    });
}

// --- Event Listeners ---

document.getElementById('btnSahibindenSale')?.addEventListener('click', () => {
    launchPortals([PORTAL_URLS.sahibinden_sale]);
});

document.getElementById('btnSahibindenRent')?.addEventListener('click', () => {
    launchPortals([PORTAL_URLS.sahibinden_rent]);
});

document.getElementById('btnHepsi').addEventListener('click', () => {
    launchPortals([PORTAL_URLS.hepsiemlak_sale, PORTAL_URLS.hepsiemlak_rent]);
});

document.getElementById('btnEmlakjet').addEventListener('click', () => {
    launchPortals([PORTAL_URLS.emlakjet_sale, PORTAL_URLS.emlakjet_rent]);
});

document.getElementById('btnWhatsApp').addEventListener('click', () => {
    launchPortals([PORTAL_URLS.whatsapp]);
});

document.getElementById('turboBtn').addEventListener('click', () => {
    launchPortals([
        PORTAL_URLS.sahibinden_sale,
        PORTAL_URLS.sahibinden_rent,
        PORTAL_URLS.hepsiemlak_sale,
        PORTAL_URLS.hepsiemlak_rent,
        PORTAL_URLS.emlakjet_sale,
        PORTAL_URLS.emlakjet_rent
    ]);
});

document.getElementById('stopBtn').addEventListener('click', () => {
    chrome.storage.local.set({ is_running: false, last_status: "Durduruldu", active_tab_ids: {} });
    chrome.runtime.sendMessage({ action: "stop_automation" });
    document.getElementById('status').innerText = "⏹ Durduruldu";
});

document.getElementById('testBtn').addEventListener('click', () => {
    document.getElementById('status').innerText = "Bağlantı test ediliyor...";
    chrome.storage.local.get(['extension_api_key'], (data) => {
        fetch('http://127.0.0.1:5005/api/health', {
            headers: { 'X-Extension-API-Key': data.extension_api_key || '' }
        })
            .then(r => r.json())
            .then(data => {
                document.getElementById('status').innerText = `✅ Bağlantı Başarılı (v${data.debugVersion || '?'})`;
            })
            .catch(err => {
                document.getElementById('status').innerText = `❌ Sunucuya Bağlanılamadı`;
            });
    });
});

document.getElementById('configBtn')?.addEventListener('click', () => {
    const currentKey = prompt("Lütfen Extension API Key giriniz:");
    if (currentKey !== null) {
        chrome.storage.local.set({ extension_api_key: currentKey }, () => {
            alert("API Key kaydedildi.");
        });
    }
});

setInterval(updateUI, 1000);
updateUI();
