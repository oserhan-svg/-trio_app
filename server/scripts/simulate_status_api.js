const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getSessionManager } = require('../services/sessionManager');

async function simulateStatus() {
    try {
        const sessionManager = getSessionManager();
        const sessionStats = sessionManager.getStats();

        const propertyCount = await prisma.property.count();
        const latestProp = await prisma.property.findFirst({
            orderBy: { last_scraped: 'desc' },
            select: { last_scraped: true }
        });
        const latestSync = latestProp ? latestProp.last_scraped : null;

        const response = {
            success: true,
            session: {
                requestCount: sessionStats.requestCount,
                portalStats: sessionStats.portalStats,
            },
            database: {
                propertyCount: propertyCount,
                latestSync: latestSync
            }
        };

        console.log('--- SIMULATED API RESPONSE ---');
        console.log(JSON.stringify(response, null, 2));

    } catch (e) {
        console.error('Simulation failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

simulateStatus();
