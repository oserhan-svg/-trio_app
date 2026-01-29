const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const analyticsService = require('./services/analyticsService');

async function simulateFrontendRequest() {
    console.log('--- Simulating Frontend Request ---');

    // Exact params from OpportunityListGenerator.jsx
    const query = {
        page: 1,
        limit: 50,
        status: 'active',
        opportunity_filter: 'opportunity'
        // radar_category is undefined for "All Types"
    };

    const {
        status, radar_category, opportunity_filter
    } = query;

    const where = { AND: [] };
    where.AND.push({ status: 'active' });

    // is_primary logic
    const show_all = false;
    const isIdRequest = false;
    if (!show_all && !isIdRequest && !radar_category && !opportunity_filter) {
        where.AND.push({ is_primary: true });
    }

    console.log('Final Where Clause:', JSON.stringify(where, null, 2));

    const [rawProps, statsMap] = await Promise.all([
        prisma.property.findMany({
            where,
            select: {
                id: true, price: true, district: true, neighborhood: true,
                created_at: true, url: true, external_id: true, group_id: true,
                history: {
                    select: { price: true, changed_at: true },
                    orderBy: { changed_at: 'desc' },
                    take: 2
                }
            }
        }),
        analyticsService.getNeighborhoodStatsMap()
    ]);

    console.log(`DB Count: ${rawProps.length}`);

    let processed = rawProps.filter(p => {
        const sortedHistory = [...p.history].reverse();
        const analysis = analyticsService.scoreProperty(p, statsMap, sortedHistory);
        const label = (analysis.label || '').toLocaleUpperCase('tr-TR');
        const isFirsat = label.includes('FIRSAT') || label.includes('KELEPİR');
        p._analysis = analysis;
        return true;
    });

    console.log(`After Analysis Count: ${processed.length}`);

    processed = processed.filter(p => {
        const analysis = p._analysis;
        const label = (analysis.label || '').toLocaleUpperCase('tr-TR');
        const isFirsat = label.includes('FIRSAT') || label.includes('KELEPİR');

        if (opportunity_filter === 'opportunity') return isFirsat || (Number(analysis.score) >= 70);
        return true;
    });

    console.log(`After Opportunity Filter Count: ${processed.length}`);

    const seenGroups = new Set();
    const deduped = processed.filter(p => {
        if (!p.group_id) return true;
        if (seenGroups.has(p.group_id)) return false;
        seenGroups.add(p.group_id);
        return true;
    });

    console.log(`After Deduplication Count: ${deduped.length}`);

    await prisma.$disconnect();
}

simulateFrontendRequest().catch(console.error);
