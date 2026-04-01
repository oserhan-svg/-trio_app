const express = require('express');
const router = express.Router();
const { authenticateToken, extensionAuth } = require('../middleware/authMiddleware');
const { scrapeProperties, syncPortfolio } = require('../services/scraperService');
const { getSessionManager } = require('../services/sessionManager');
const { getProxyStats } = require('../services/proxyIntegration');
const scraperConfig = require('../config/scraperConfig');
const prisma = require('../db');

/**
 * POST /api/scraper/trigger
 * [DEPRECATED] Internal scraper trigger
 */
router.post('/trigger', authenticateToken, async (req, res) => {
    // Only admins can trigger legacy scraper
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Legacy scraper is disabled' });
    }
    // Still allow it for emergency debugging but with warning
    console.log(`⚠️ Legacy Scraper Triggered by ${req.user.name}`);
    res.status(410).json({ error: 'Bu özellik kullanımdan kaldırıldı. Lütfen Trio Assistant eklentisini kullanın.' });
});

/**
 * POST /api/scraper/import
 * Import listings from Chrome Extension (Trio Assistant)
 */
router.post('/import', extensionAuth, async (req, res) => {
    try {
        let { listings, provider } = req.body;

        if (!listings || !Array.isArray(listings)) {
            console.warn(`⚠️ [EXTENSION IMPORT] Invalid data format from ${provider}`);
            return res.status(400).json({ error: 'Invalid data format. Expected listings array.' });
        }

        // AUTO-DETECT PROVIDER if missing or generic
        if ((!provider || provider === 'unknown' || provider === 'sahibinden') && listings.length > 0) {
            const firstUrl = listings[0].url || '';
            if (firstUrl.includes('hepsiemlak.com')) provider = 'hepsiemlak';
            else if (firstUrl.includes('emlakjet.com')) provider = 'emlakjet';
            else if (firstUrl.includes('sahibinden.com')) provider = 'sahibinden';
        }

        console.log(`\n📥 [EXTENSION IMPORT] Received ${listings.length} listings from ${provider || 'Unknown'}`);
        console.log(`   Sample: ${listings.length > 0 ? listings[0].title : 'Empty'}`);

        const { saveListings } = require('../services/scraperService');
        const sessionManager = getSessionManager();

        // 1. Save to DB
        if (listings.length > 0) {
            await saveListings(listings);
        }

        // 2. Update Stats
        const finalProvider = provider || 'sahibinden';
        sessionManager.trackRequest(listings.length > 0, finalProvider);
        sessionManager.trackRawListings(listings.length);

        if (listings.length > 0) {
            sessionManager.trackListings(finalProvider, listings.length);
            sessionManager.addEvent(`Eklenti: ${listings.length} ilan içe aktarıldı (${finalProvider})`, 'success', finalProvider);
        } else {
            sessionManager.addEvent(`Eklenti: İlan bulunamadı! Sayfa boş olabilir veya seçiciler hatalı (${finalProvider})`, 'warning', finalProvider);
        }

        res.json({
            success: true,
            message: `Imported ${listings.length} listings from ${finalProvider}`,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/scraper/sync-portfolio
 * [DEPRECATED] Portfolio sync trigger
 */
router.post('/sync-portfolio', authenticateToken, async (req, res) => {
    res.status(410).json({ error: 'Bu özellik kullanımdan kaldırıldı. Lütfen Trio Assistant eklentisini kullanın.' });
});

/**
 * POST /api/scraper/finished
 * Portal reports it has finished its run
 */
router.post('/finished', extensionAuth, async (req, res) => {
    const { provider, reason } = req.body;
    const sessionManager = getSessionManager();
    console.log(`🏁 [SCRAPER] Portal ${provider} finished. Reason: ${reason || 'End of pages'}`);
    sessionManager.addEvent(`Portal tamamlandı: ${provider} (Nedene: ${reason || 'Sayfa sonu'})`, 'info', provider);
    res.json({ success: true });
});

/**
 * GET /api/scraper/status
 * Get current scraper status (Extension-Only Mode)
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const sessionManager = getSessionManager();
        let sessionStats = sessionManager.getStats();
        let mergedFromFile = false;

        // Check if we have standalone mode data (from JSON file)
        const { SessionManager } = require('../services/sessionManager');
        const standaloneData = SessionManager.loadFromFile();

        if (standaloneData && standaloneData.portalStats) {
            const dataAge = Date.now() - new Date(standaloneData.timestamp || 0).getTime();
            const MAX_AGE = 48 * 60 * 60 * 1000; // 48 hours for even better persistence

            if (dataAge < MAX_AGE) {
                const mergedPortalStats = { ...sessionStats.portalStats };
                let totalListingCount = sessionStats.listingCount || 0;
                let changesFound = false;

                Object.keys(standaloneData.portalStats).forEach(portal => {
                    const local = sessionStats.portalStats[portal] || { requestCount: 0, listingCount: 0 };
                    const saved = standaloneData.portalStats[portal];

                    // If file has better data for this portal, use it
                    if (saved && (saved.requestCount > local.requestCount || saved.listingCount > local.listingCount)) {
                        mergedPortalStats[portal] = saved;
                        changesFound = true;
                    }
                });

                if (changesFound) {
                    sessionStats.portalStats = mergedPortalStats;

                    // CRITICAL FIX: Recalculate total listingCount from merged portal stats
                    sessionStats.listingCount = Object.values(mergedPortalStats).reduce((sum, p) => sum + (p.listingCount || 0), 0);

                    mergedFromFile = true;

                    // Also merge events if needed
                    if ((sessionStats.recentEvents || []).length < 5 && (standaloneData.recentEvents || []).length > 0) {
                        const allEvents = [...(sessionStats.recentEvents || []), ...(standaloneData.recentEvents || [])];
                        const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values())
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .slice(0, 50);
                        sessionStats.recentEvents = uniqueEvents;
                    }
                }
            }
        }

        // Get latest database update
        const latestProp = await prisma.property.findFirst({
            orderBy: { last_scraped: 'desc' },
            select: { last_scraped: true }
        });
        const latestSync = latestProp ? latestProp.last_scraped : null;

        // Get robust portal counts via DB-level optimization
        const portalAggregation = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%' OR external_id LIKE 'sh-%') as sahibinden,
                COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR external_id LIKE 'he-%') as hepsiemlak,
                COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%' OR external_id LIKE 'ej-%') as emlakjet
            FROM properties
        `;

        const statsRow = portalAggregation[0] || { total: 0, sahibinden: 0, hepsiemlak: 0, emlakjet: 0 };
        const totalCount = Number(statsRow.total || 0);
        const portalCounts = {
            sahibinden: Number(statsRow.sahibinden || 0),
            hepsiemlak: Number(statsRow.hepsiemlak || 0),
            emlakjet: Number(statsRow.emlakjet || 0)
        };

        const mainPortalsCount = portalCounts.sahibinden + portalCounts.hepsiemlak + portalCounts.emlakjet;
        portalCounts.other = Math.max(0, totalCount - mainPortalsCount);

        console.log(`[DEBUG_STATS] Total: ${totalCount}, S: ${portalCounts.sahibinden}, H: ${portalCounts.hepsiemlak}, E: ${portalCounts.emlakjet}`);

        const os = require('os');
        const memory = process.memoryUsage();
        const resources = {
            cpu: Math.round((os.loadavg()[0] / os.cpus().length) * 100) + '%',
            memory: Math.round(memory.rss / 1024 / 1024) + 'MB',
            proxyHealth: Math.round((getProxyStats().healthScore || 0) * 100) + '%',
            activeBrowsers: sessionManager.currentBrowser ? 1 : 0
        };

        res.json({
            success: true,
            isExtensionOnly: true,
            isMerged: mergedFromFile,
            session: {
                requestCount: sessionStats.requestCount,
                successCount: sessionStats.successCount,
                failureCount: sessionStats.failureCount,
                successRate: sessionStats.successRate,
                listingCount: sessionStats.listingCount || 0,
                portalStats: sessionStats.portalStats,
                recentEvents: sessionStats.recentEvents
            },
            database: {
                propertyCount: totalCount,
                portalCounts: portalCounts,
                latestSync: latestSync
            },
            resources,
            debugVersion: '2.2-STATS',
            timestamp: new Date()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/scraper/config
 * Get current scraper configuration
 */
router.get('/config', authenticateToken, async (req, res) => {
    try {
        // Only admins can view config
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin only' });
        }

        res.json({
            success: true,
            config: {
                proxyEnabled: scraperConfig.stealth.proxyManager.enabled,
                proxyStrategy: scraperConfig.stealth.proxyManager.rotationStrategy,
                minHealthScore: scraperConfig.stealth.proxyManager.minHealthScore,
                healthCheckEnabled: scraperConfig.stealth.proxyManager.enableHealthCheck,
                sources: {
                    webshare: !!scraperConfig.stealth.proxyManager.webshareApiKey,
                    proxyscrape: scraperConfig.stealth.proxyManager.enableProxyScrape,
                    freeProxyList: scraperConfig.stealth.proxyManager.enableFreeProxyList
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/scraper/health
 * Get health metrics for all scrapers/portals
 */
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const sessionManager = getSessionManager();
        const stats = sessionManager.getStats();
        const portalStats = stats.portalStats || {};

        const portals = ['sahibinden', 'hepsiemlak', 'emlakjet'];
        const health = {};

        portals.forEach(portal => {
            const s = portalStats[portal] || { requestCount: 0, successCount: 0, failureCount: 0, lastSuccess: null };
            let score = 100;

            if (s.requestCount > 5) {
                // Base score on success rate
                const rate = s.successCount / s.requestCount;
                score = Math.floor(rate * 100);
            }

            // Degrade if last success was long ago (if we have requests but no recent success)
            if (s.requestCount > 0 && s.lastSuccess) {
                const ageHours = (Date.now() - new Date(s.lastSuccess).getTime()) / (1000 * 60 * 60);
                if (ageHours > 24) score = Math.max(0, score - 20);
                if (ageHours > 72) score = Math.max(0, score - 50);
            }

            let status = 'healthy';
            if (score < 40) status = 'critical';
            else if (score < 80) status = 'degraded';

            health[portal] = {
                status,
                score,
                lastSuccess: s.lastSuccess,
                requestCount: s.requestCount,
                successCount: s.successCount
            };
        });

        res.json(health);
    } catch (error) {
        console.error('Health Check Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
