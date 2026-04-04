const prisma = require('../server/db');
const analyticsService = require('../server/services/analyticsService');

async function benchmark() {
    try {
        console.log('--- Benchmarking Analytics & Admin Stats ---');

        // 1. Benchmark Analytics Stats Logic
        console.log('\n[1/2] Benchmarking Analytics Logic...');
        const start1 = Date.now();

        // Emulate analyticsController.getStats (ignoring some details)
        const statsMap = await analyticsService.getNeighborhoodStatsMap();
        const supplyDemand = await analyticsService.getSupplyDemandStats();
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

        const end1 = Date.now();
        console.log(`Analytics Calculation took: ${end1 - start1}ms`);

        // 2. Benchmark Admin Stats Logic
        console.log('\n[2/2] Benchmarking Admin Logic...');
        const start2 = Date.now();

        // Emulate adminController.getDashboardStats
        const totalProperties2 = await prisma.property.count();
        const sahibindenCount2 = await prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        });
        const hepsiemlakCount2 = await prisma.property.count({
            where: {
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });
        const emlakjetCount2 = await prisma.property.count({
            where: { url: { contains: 'emlakjet.com' } }
        });
        const assignedCount2 = await prisma.property.count({
            where: { assigned_user_id: { not: null } }
        });

        const end2 = Date.now();
        console.log(`Admin Calculation took: ${end2 - start2}ms`);

    } catch (error) {
        console.error('Benchmark Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
