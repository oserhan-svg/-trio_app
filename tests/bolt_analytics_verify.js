const prisma = require('../server/db');
const analyticsService = require('../server/services/analyticsService');
const cacheService = require('../server/services/cacheService');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics Performance (Cold Cache) ---');

        // 1. CLEAR CACHE
        cacheService.clearNamespace('analytics');
        cacheService.clearNamespace('global');
        console.log('Cache cleared.');

        const startSeq = Date.now();
        // Simulation of sequential controller logic
        const s1 = Date.now();
        const statsMap = await analyticsService.getNeighborhoodStatsMap();
        const s2 = Date.now();
        const supplyDemand = await analyticsService.getSupplyDemandStats();
        const s3 = Date.now();
        const countsSeq = {
            total: await prisma.property.count(),
            sahibinden: await prisma.property.count({ where: { url: { contains: 'sahibinden.com' } } }),
            hepsiemlak: await prisma.property.count({
                where: { OR: [ { url: { contains: 'hepsiemlak.com' } }, { url: { contains: 'hemlak.com' } } ] }
            }),
            emlakjet: await prisma.property.count({ where: { url: { contains: 'emlakjet.com' } } }),
            assigned: await prisma.property.count({ where: { assigned_user_id: { not: null } } })
        };
        const endSeq = Date.now();

        console.log(`Sequential execution time: ${endSeq - startSeq}ms`);
        console.log(`- statsMap: ${s2 - s1}ms`);
        console.log(`- supplyDemand: ${s3 - s2}ms`);
        console.log(`- countsSeq: ${endSeq - s3}ms`);

        // 2. CLEAR CACHE AGAIN for Optimized measurement
        cacheService.clearNamespace('analytics');
        console.log('\nCache cleared again.');

        const startOpt = Date.now();
        const [optStatsMap, optSupplyDemand, propertyCounts] = await Promise.all([
            analyticsService.getNeighborhoodStatsMap(),
            analyticsService.getSupplyDemandStats(),
            prisma.$queryRaw`
                SELECT
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%')::int as sahibinden,
                    COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%')::int as hepsiemlak,
                    COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%')::int as emlakjet,
                    COUNT(*) FILTER (WHERE assigned_user_id IS NOT NULL)::int as assigned
                FROM "properties"
            `
        ]);
        const endOpt = Date.now();
        console.log(`Optimized (Parallel + Raw SQL) execution time: ${endOpt - startOpt}ms`);

        const totalSeq = endSeq - startSeq;
        const totalOpt = endOpt - startOpt;
        console.log(`\nImprovement: ${totalSeq - totalOpt}ms (${((totalSeq - totalOpt) / totalSeq * 100).toFixed(1)}%)`);

        // 3. WARM CACHE measurement
        const startWarm = Date.now();
        await Promise.all([
            analyticsService.getNeighborhoodStatsMap(),
            analyticsService.getSupplyDemandStats()
        ]);
        const endWarm = Date.now();
        console.log(`Warm cache retrieval: ${endWarm - startWarm}ms`);

    } catch (error) {
        console.error('Benchmark Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
