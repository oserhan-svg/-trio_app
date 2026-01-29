const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const analyticsService = require('./services/analyticsService');

async function testLogic() {
    const rc = 'villa';
    const where = { AND: [] };
    where.AND.push({ status: 'active' });
    where.AND.push({
        OR: [
            { category: { in: ['villa', 'mustakil', 'yaka', 'müstakil'] } },
            { title: { contains: 'villa', mode: 'insensitive' } },
            { title: { contains: 'müstakil', mode: 'insensitive' } },
            { title: { contains: 'yazlık', mode: 'insensitive' } },
            { description: { contains: 'villa', mode: 'insensitive' } }
        ]
    });
    // logic omits is_primary since radar_category is present

    console.log('--- Querying with WHERE:', JSON.stringify(where, null, 2));

    const [rawProps, statsMap] = await Promise.all([
        prisma.property.findMany({
            where,
            select: {
                id: true, price: true, district: true, neighborhood: true,
                created_at: true, url: true, external_id: true, group_id: true,
                category: true,
                history: {
                    select: { price: true, changed_at: true },
                    orderBy: { changed_at: 'desc' },
                    take: 2
                }
            }
        }),
        analyticsService.getNeighborhoodStatsMap()
    ]);

    console.log(`PASS 1: Prisma returned ${rawProps.length} active property/dwelling listings.`);

    let processed = rawProps.filter(p => {
        const sortedHistory = [...p.history].reverse();
        const analysis = analyticsService.scoreProperty(p, statsMap, sortedHistory);
        const label = (analysis.label || '').toUpperCase();
        const isFirsat = label.includes('FIRSAT') || label.includes('KELEPİR');
        p._analysis = analysis;
        return true;
    });

    console.log(`Memory assigned analysis to ${processed.length} items.`);

    const filterTarget = 'opportunity';
    processed = processed.filter(p => {
        const analysis = p._analysis;
        const label = (analysis.label || '').toUpperCase();
        const isFirsat = label.includes('FIRSAT') || label.includes('KELEPİR');

        if (filterTarget === 'opportunity') return isFirsat || (Number(analysis.score) >= 70);
        return true;
    });

    console.log(`Memory filtered down to ${processed.length} opportunities.`);

    const seenGroups = new Set();
    const deduped = processed.filter(p => {
        if (!p.group_id) return true;
        if (seenGroups.has(p.group_id)) return false;
        seenGroups.add(p.group_id);
        return true;
    });

    console.log(`Deduplicated to ${deduped.length} items.`);

    if (deduped.length > 0) {
        console.log('Sample Item Label:', deduped[0]._analysis.label);
        console.log('Sample Item Score:', deduped[0]._analysis.score);
    }

    await prisma.$disconnect();
}

testLogic().catch(console.error);
