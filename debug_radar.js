const prisma = require('./server/db');
const analyticsService = require('./server/services/analyticsService');

async function debugRadar() {
    try {
        console.log('--- OPPORTUNITY RADAR DEBUG ---');

        // 1. Get stats map
        const statsMap = await analyticsService.getNeighborhoodStatsMap();
        console.log(`\nNeighborhoods in Stats Map: ${Object.keys(statsMap).length - 1}`);

        // Show sample of stats map
        const sampleKeys = Object.keys(statsMap).slice(0, 5).filter(k => k !== '_heatmapData');
        console.log('\nSample Neighborhood Stats:');
        sampleKeys.forEach(k => {
            console.log(`- ${k}: Avg Price: ${statsMap[k].avg}, Count: ${statsMap[k].count}`);
        });

        // 2. Fetch some properties and score them
        const rawProps = await prisma.property.findMany({
            where: { status: 'active' },
            take: 100,
            include: {
                history: {
                    select: { price: true, changed_at: true },
                    orderBy: { changed_at: 'desc' },
                    take: 2
                }
            }
        });

        console.log(`\nAnalyzing ${rawProps.length} properties...`);
        let findings = [];

        rawProps.forEach(p => {
            const key = `${p.district}-${p.neighborhood}`.toLowerCase();
            const analysis = analyticsService.scoreProperty(p, statsMap, p.history);

            if (analysis.score >= 60 || analysis.label !== 'Normal') {
                findings.push({
                    id: p.id,
                    external_id: p.external_id,
                    category: p.category,
                    key,
                    price: p.price,
                    score: analysis.score,
                    label: analysis.label,
                    deviation: analysis.deviation
                });
            }
        });

        if (findings.length === 0) {
            console.log('\n❌ No opportunities found in 100 samples.');

            // Check why - pick one property and show its stats key
            const p = rawProps[0];
            const pKey = `${p.district}-${p.neighborhood}`.toLowerCase();
            console.log(`\nFirst property debug Info:`);
            console.log(`- District: ${p.district}, Neighborhood: ${p.neighborhood}`);
            console.log(`- Derived Key: [${pKey}]`);
            console.log(`- In Stats Map? ${statsMap[pKey] ? 'YES' : 'NO'}`);
            if (!statsMap[pKey]) {
                const similarKeys = Object.keys(statsMap).filter(k => k.includes(p.district ? p.district.toLowerCase() : ''));
                console.log(`- Similar keys in map: ${similarKeys.slice(0, 5).join(', ')}`);
            }
        } else {
            console.log(`\n✅ Found ${findings.length} opportunities in 100 samples:`);
            findings.forEach(f => {
                console.log(`- [${f.external_id}] [Cat: ${f.category}] Score: ${f.score}, Label: ${f.label}, Dev: ${f.deviation}%`);
            });
        }

        // 3. Count total active properties and total opportunities
        const totalActive = await prisma.property.count({ where: { status: 'active' } });
        console.log(`\nTotal Active Properties: ${totalActive}`);

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

debugRadar();
