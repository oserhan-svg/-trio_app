const prisma = require('./server/db');
const { getSessionManager } = require('./server/services/sessionManager');
const { getProxyStats } = require('./server/services/proxyIntegration');

async function simulateStatus() {
    try {
        const sessionManager = getSessionManager();
        let sessionStats = sessionManager.getStats();

        // Check if we have standalone mode data (from JSON file)
        const { SessionManager } = require('./server/services/sessionManager');
        const standaloneData = SessionManager.loadFromFile();

        if (standaloneData && standaloneData.portalStats) {
            // (Same logic as in scraperRoutes.js)
            const mergedPortalStats = { ...sessionStats.portalStats };
            let changesFound = false;

            Object.keys(standaloneData.portalStats).forEach(portal => {
                const local = sessionStats.portalStats[portal] || { requestCount: 0, listingCount: 0 };
                const saved = standaloneData.portalStats[portal];
                if (saved && (saved.requestCount > local.requestCount || saved.listingCount > local.listingCount)) {
                    mergedPortalStats[portal] = saved;
                    changesFound = true;
                }
            });

            if (changesFound) {
                sessionStats.portalStats = mergedPortalStats;
                sessionStats.listingCount = Object.values(mergedPortalStats).reduce((sum, p) => sum + (p.listingCount || 0), 0);
            }
        }

        // DB Counts
        const totalCount = await prisma.property.count();
        const portalCounts = {
            sahibinden: await prisma.property.count({
                where: { OR: [{ url: { contains: 'sahibinden.com' } }, { external_id: { startsWith: 'sh-' } }] }
            }),
            hepsiemlak: await prisma.property.count({
                where: {
                    OR: [
                        { url: { contains: 'hepsiemlak.com' } },
                        { external_id: { startsWith: 'he-' } },
                        {
                            AND: [
                                { url: { contains: 'hepsiemlak.com' } },
                                { external_id: { not: { startsWith: 'sh-' } } }
                            ]
                        }
                    ]
                }
            }),
            emlakjet: await prisma.property.count({
                where: { OR: [{ url: { contains: 'emlakjet.com' } }, { external_id: { startsWith: 'ej-' } }] }
            })
        };
        portalCounts.other = totalCount - (portalCounts.sahibinden + portalCounts.hepsiemlak + portalCounts.emlakjet);

        console.log('--- SIMULATED RESPONSE ---');
        console.log(JSON.stringify({
            session: {
                listingCount: sessionStats.listingCount,
                portalStats: sessionStats.portalStats
            },
            database: {
                propertyCount: totalCount,
                portalCounts: portalCounts
            }
        }, null, 2));

    } catch (e) {
        console.error('Simulation Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

simulateStatus();
