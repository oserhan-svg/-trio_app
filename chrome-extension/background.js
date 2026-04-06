// TRIO ASSISTANT - Background Worker (Phase 4 Optimized)

/**
 * Reliable message sender with exponential backoff and tab existence check
 */
async function reliableSendMessage(tabId, message, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            // Check if tab still exists
            const tab = await chrome.tabs.get(tabId).catch(() => null);
            if (!tab) {
                console.warn(`🛑 Tab ${tabId} closed, canceling message [${message.action}]`);
                return false;
            }

            await chrome.tabs.sendMessage(tabId, message);
            console.log(`✅ delivered [${message.action}] to tab ${tabId}`);
            return true;
        } catch (e) {
            console.warn(`⏳ Tab ${tabId} busy, retry ${i + 1}/${retries}...`);
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    return false;
}

// Internal state to prevent storage race conditions
let activeTabRegistry = {};

// Restore registry from storage on startup
chrome.storage.local.get(['active_tab_ids'], (result) => {
    activeTabRegistry = result.active_tab_ids || {};
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ready_to_scrape") {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        console.log(`👋 Tab ${tabId} (${request.source}) is READY`);

        // CRITICAL FIX: Check STORAGE, not memory
        chrome.storage.local.get(['is_running', 'active_tab_ids'], (data) => {
            if (data.is_running) {
                activeTabRegistry = data.active_tab_ids || {};
                activeTabRegistry[tabId] = true;
                chrome.storage.local.set({ active_tab_ids: activeTabRegistry });

                console.log(`🚀 Sending Wake-Up to ${tabId}`);
                reliableSendMessage(tabId, { action: "scrape_page" });
            } else {
                console.log(`⏸️ Automation not active. Ignoring ready signal.`);
            }
        });
        return true;
    }
    else if (request.action === "launch_portals") {
        const { urls } = request;

        (async () => {
            const newTabIds = [];
            for (const url of urls) {
                try {
                    const tab = await new Promise(resolve => {
                        chrome.tabs.create({ url, active: true }, (t) => resolve(t));
                    });
                    if (tab) newTabIds.push(tab.id);
                    await new Promise(r => setTimeout(r, 1500));
                } catch (e) { console.error('Tab launch error:', e); }
            }

            chrome.storage.local.get(['active_tab_ids'], (data) => {
                const currentIds = data.active_tab_ids || {};
                const mergedIds = { ...currentIds };
                newTabIds.forEach(id => mergedIds[id] = true);

                chrome.storage.local.set({
                    active_tab_ids: mergedIds,
                    is_running: true,
                    last_status: `Aktif: ${Object.keys(mergedIds).length} Portal/Sync`
                });
            });
        })();

        return true;
    }
    else if (request.action === "start_automation") {
        const tabId = request.tabId;
        chrome.storage.local.get(['active_tab_ids'], (data) => {
            activeTabRegistry = data.active_tab_ids || {};
            activeTabRegistry[tabId] = true;

            chrome.storage.local.set({
                active_tab_ids: activeTabRegistry,
                is_running: true,
                last_status: "Portallar Başlatıldı..."
            });

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).then(() => {
                console.log(`💉 Injected content.js into ${tabId}`);
                reliableSendMessage(tabId, { action: "scrape_page" });
            }).catch(err => {
                console.warn(`⚠️ Injection skipped for ${tabId}:`, err);
                reliableSendMessage(tabId, { action: "scrape_page" });
            });
        });
        return true;
    }
    else if (request.action === "stop_automation") {
        activeTabRegistry = {};
        chrome.storage.local.set({ is_running: false, active_tab_ids: {} });
        return true;
    }
    else if (request.action === "automation_finished") {
        const tabId = sender.tab?.id;
        const { source, reason } = request;
        if (tabId) {
            chrome.storage.local.get(['active_tab_ids'], (data) => {
                activeTabRegistry = data.active_tab_ids || {};
                delete activeTabRegistry[tabId];

                const stillRunning = Object.keys(activeTabRegistry).length > 0;

                chrome.storage.local.set({
                    active_tab_ids: activeTabRegistry,
                    is_running: stillRunning,
                    last_status: stillRunning ? `Geriye ${Object.keys(activeTabRegistry).length} hat kaldı` : "Tüm işlemler tamamlandı"
                });

                if (source !== 'whatsapp') {
                    chrome.storage.local.get(['extension_api_key'], (apiKeyData) => {
                        fetch('http://127.0.0.1:5005/api/scraper/finished', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Extension-API-Key': apiKeyData.extension_api_key || ''
                            },
                            body: JSON.stringify({ provider: source || 'unknown', reason: reason || 'Page end' })
                        }).catch(() => { });
                    });
                }
            });
        }
        return true;
    }
    else if (request.action === "whatsapp_data_extracted") {
        const { partnerName, profilePicUrl, messages } = request;
        console.log(`📥 Received ${messages.length} WhatsApp messages from ${partnerName} (Pic: ${!!profilePicUrl})`);

        chrome.storage.local.get(['extension_api_key'], (apiKeyData) => {
            fetch('http://127.0.0.1:5005/api/whatsapp/extension-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-API-Key': apiKeyData.extension_api_key || ''
                },
                body: JSON.stringify({ partnerName, profilePicUrl, messages })
            }).catch(err => console.error('❌ WhatsApp Sync Error:', err));
        });

        return true;
    }
    else if (request.action === "data_extracted") {
        const { listings, source } = request;
        const tabId = sender.tab?.id;
        if (!tabId) return true;

        if (typeof updatePortalHeartbeat === 'function') updatePortalHeartbeat(tabId);

        chrome.storage.local.get(['scraped_count', 'page_count', 'is_running', 'active_tab_ids', 'extension_api_key'], async (data) => {
            if (!data.is_running) return;

            const url = 'http://127.0.0.1:5005/api/scraper/import';
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Extension-API-Key': data.extension_api_key || ''
                    },
                    body: JSON.stringify({ listings, provider: source })
                });

                if (response.ok) {
                    chrome.storage.local.set({
                        scraped_count: (data.scraped_count || 0) + listings.length,
                        page_count: (data.page_count || 0) + 1,
                        last_status: `📈 [${source}] Imported ${listings.length} items`
                    });

                    const jitterDelay = Math.floor(Math.random() * 4000) + 3000;
                    setTimeout(() => {
                        chrome.storage.local.get(['is_running', 'active_tab_ids'], (s) => {
                            if (s.is_running && s.active_tab_ids && s.active_tab_ids[tabId]) {
                                reliableSendMessage(tabId, { action: "next_page" });
                            }
                        });
                    }, jitterDelay);
                }
            } catch (err) {
                console.error('❌ Sync Error:', err);
            }
        });
        return true;
    }
});

// Auto-Scrape on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
        chrome.storage.local.get(['is_running', 'active_tab_ids'], (data) => {
            if (data.is_running && data.active_tab_ids && data.active_tab_ids[tabId]) {
                const navJitter = Math.floor(Math.random() * 2000) + 1500;
                setTimeout(() => {
                    reliableSendMessage(tabId, { action: "scrape_page" });
                }, navJitter);
            }
        });
    }
});

// Keep-alive heartbeat
chrome.alarms.create('heartbeat', { periodInMinutes: 0.5 });
const portalHeartbeats = {};

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'heartbeat') {
        chrome.storage.local.get(['is_running', 'active_tab_ids'], (data) => {
            if (!data.is_running || !data.active_tab_ids) return;

            const now = Date.now();
            Object.keys(data.active_tab_ids).forEach(tabId => {
                const lastSeen = portalHeartbeats[tabId] || 0;
                if (now - lastSeen > 60000) {
                    console.warn(`🚀 [WATCHDOG] Tab ${tabId} stalled. Sending wake-up...`);
                    reliableSendMessage(parseInt(tabId), { action: "scrape_page" });
                    portalHeartbeats[tabId] = now;
                }
            });
        });
    }
});

function updatePortalHeartbeat(tabId) {
    portalHeartbeats[tabId] = Date.now();
}
