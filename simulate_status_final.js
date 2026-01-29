const prisma = require('./server/db');

async function simulateStatusFinal() {
    try {
        // DB Counts
        const totalCount = await prisma.property.count();

        const portalCounts = {
            sahibinden: await prisma.property.count({
                where: { OR: [{ url: { contains: 'sahibinden.com' } }, { external_id: { startsWith: 'sh-' } }] }
            }),
            hepsiemlak: await prisma.property.count({
                where: { OR: [{ url: { contains: 'hepsiemlak.com' } }, { external_id: { startsWith: 'he-' } }] }
            }),
            emlakjet: await prisma.property.count({
                where: { OR: [{ url: { contains: 'emlakjet.com' } }, { external_id: { startsWith: 'ej-' } }] }
            })
        };
        const mainPortalsCount = portalCounts.sahibinden + portalCounts.hepsiemlak + portalCounts.emlakjet;
        portalCounts.other = Math.max(0, totalCount - mainPortalsCount);

        console.log('--- FINAL SIMULATED RESPONSE ---');
        console.log(JSON.stringify({
            database: {
                propertyCount: totalCount,
                portalCounts: portalCounts
            }
        }, null, 2));

    } catch (e) {
        console.error('Simulation Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

simulateStatusFinal();
