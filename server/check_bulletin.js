const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const analyticsService = require('./services/analyticsService');

async function checkBulletinLogic() {
    console.log('--- Bulletin Logic Check ---');

    // Simulate Bulletin 'All Types' + 'Opportunities'
    const where = { AND: [{ status: 'active' }] };

    console.log('Querying Properties...');
    const properties = await prisma.property.findMany({
        where,
        select: { id: true, district: true, neighborhood: true, price: true, history: true }
    });

    console.log(`Total Active Listings: ${properties.length}`);

    const statsMap = await analyticsService.getNeighborhoodStatsMap();

    const results = properties.map(p => {
        const analysis = analyticsService.scoreProperty(p, statsMap, p.history);
        return {
            id: p.id,
            label: analysis.label,
            score: analysis.score,
            district: p.district,
            neighborhood: p.neighborhood
        };
    });

    const opps = results.filter(r => r.label === 'FIRSAT' || r.label === 'KELEPİR' || r.score >= 60);
    console.log(`Opportunities Found: ${opps.length}`);

    if (opps.length > 0) {
        console.log('Example Opportunity:', opps[0]);
    } else {
        console.log('NO OPPORTUNITIES FOUND IN 100% OF ACTIVE LISTINGS.');
        // Check some stats
        const samples = results.slice(0, 5);
        console.log('Sample Scores:', samples.map(s => `${s.district}/${s.neighborhood}: score=${s.score} label=${s.label}`));
    }

    await prisma.$disconnect();
}

checkBulletinLogic().catch(console.error);
