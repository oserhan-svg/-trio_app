
const prisma = require('./server/db');
const analyticsService = require('./server/services/analyticsService');

async function test() {
    try {
        console.log('Testing analyticsService.getNeighborhoodStatsMap...');
        const statsMap = await analyticsService.getNeighborhoodStatsMap();
        console.log('Stats map keys:', Object.keys(statsMap).length);

        console.log('Testing property fetch...');
        const properties = await prisma.property.findMany({
            where: { is_primary: true },
            take: 5,
            include: { history: true }
        });
        console.log('Fetched properties:', properties.length);

        if (properties.length > 0) {
            const p = properties[0];
            console.log('Testing scoreProperty for first property...');
            const score = analyticsService.scoreProperty(p, statsMap, p.history);
            console.log('Score result:', score);

            console.log('Testing serialization logic...');
            const serialized = {
                ...p,
                price: Number(p.price),
                size_m2: p.size_m2 ? Number(p.size_m2) : null,
                opportunity_score: score.score
            };
            console.log('Serialized:', JSON.stringify(serialized, (key, value) => typeof value === 'bigint' ? value.toString() : value));
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
