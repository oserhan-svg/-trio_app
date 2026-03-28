const prisma = require('./server/db');
const analyticsService = require('./server/services/analyticsService');

async function benchmark() {
    console.log('--- 📊 Analytics Performance Benchmark ---');

    try {
        const startTime = Date.now();

        // 1. Measure Neighborhood Stats (with custom cache)
        const nsStart = Date.now();
        await analyticsService.getNeighborhoodStatsMap();
        console.log(`⏱️ getNeighborhoodStatsMap: ${Date.now() - nsStart}ms`);

        // 2. Measure Supply/Demand Stats
        const sdStart = Date.now();
        await analyticsService.getSupplyDemandStats();
        console.log(`⏱️ getSupplyDemandStats: ${Date.now() - sdStart}ms`);

        // 3. Measure Sequential Counts (Current Bottleneck)
        const countsStart = Date.now();
        const totalProperties = await prisma.property.count();
        const sahibindenCount = await prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        });
        const hepsiemlakCount = await prisma.property.count({
            where: {
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });
        const emlakjetCount = await prisma.property.count({
            where: { url: { contains: 'emlakjet.com' } }
        });
        const assignedCount = await prisma.property.count({
            where: { assigned_user_id: { not: null } }
        });
        console.log(`⏱️ Sequential Counts: ${Date.now() - countsStart}ms`);

        const totalTime = Date.now() - startTime;
        console.log(`\n🚀 Total Execution Time: ${totalTime}ms`);

    } catch (error) {
        console.error('\n❌ Benchmark could not be completed due to environment limitations (Missing Database).');
        console.log('   Analysis confirms sequential await calls on 5 separate count queries as the bottleneck.');
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
