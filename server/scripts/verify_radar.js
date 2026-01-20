const { getMarketStats, scoreProperty, getNeighborhoodStatsMap } = require('../services/analyticsService');
const prisma = require('../db');

async function testRadar() {
    console.log('--- OPPORTUNITY RADAR VERIFICATION ---');

    // 1. Check Market Stats
    const stats = await getNeighborhoodStatsMap();
    console.log('Neighborhoods analyzed:', Object.keys(stats).filter(k => !k.startsWith('_')).length);

    // 2. Find Owner vs Office
    const ownerProperties = await prisma.property.findMany({
        where: { seller_type: 'owner' },
        take: 5
    });
    const officeProperties = await prisma.property.findMany({
        where: { seller_type: 'office' },
        take: 5
    });

    const sampleProperties = [...ownerProperties, ...officeProperties];

    console.log(`\nAnalyzing ${sampleProperties.length} properties (Owner & Office):`);

    sampleProperties.forEach(p => {
        const analysis = scoreProperty(p, stats);
        console.log(`- [${analysis.label}] Score: ${analysis.score} | %${analysis.deviation} Sapma | ${p.seller_type} | ${p.title.substring(0, 30)}...`);
        if (analysis.isPremium) console.log('  ✨ Premium Feature Detected');
    });

    process.exit(0);
}

testRadar().catch(console.error);
