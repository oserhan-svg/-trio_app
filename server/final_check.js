const prisma = require('./db');
const os = require('os');
async function run() {
    try {
        console.log('--- Final API Logic Check ---');
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
        portalCounts.other = totalCount - (portalCounts.sahibinden + portalCounts.hepsiemlak + portalCounts.emlakjet);

        const response = {
            success: true,
            database: {
                propertyCount: totalCount,
                portalCounts: portalCounts
            }
        };

        console.log(JSON.stringify(response, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
