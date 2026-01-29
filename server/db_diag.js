const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const analyticsService = require('./services/analyticsService');

async function checkOpportunities() {
    console.log('--- Deep DB Diagnostic ---');

    const total = await prisma.property.count();
    const active = await prisma.property.count({ where: { status: 'active' } });
    const primary = await prisma.property.count({ where: { status: 'active', is_primary: true } });

    console.log(`Total Listings: ${total}`);
    console.log(`Active Listings: ${active}`);
    console.log(`Primary Active: ${primary}`);

    const statsMap = await analyticsService.getNeighborhoodStatsMap();
    const statsKeys = Object.keys(statsMap).filter(k => k !== '_heatmapData');
    console.log(`Neighborhood Stats Count: ${statsKeys.length}`);

    const sample = await prisma.property.findMany({
        where: { status: 'active', is_primary: true },
        include: { history: true },
        take: 500
    });

    let opports = 0;
    const labels = {};

    sample.forEach(p => {
        const analysis = analyticsService.scoreProperty(p, statsMap, p.history);
        const l = analysis.label;
        labels[l] = (labels[l] || 0) + 1;
        if (l === 'FIRSAT' || l === 'KELEPİR') opports++;
    });

    console.log('Opportunity Label Distribution in Sample (500):');
    console.table(labels);
    console.log(`Total Opportunities in Sample: ${opports}`);

    await prisma.$disconnect();
}

checkOpportunities().catch(console.error);
