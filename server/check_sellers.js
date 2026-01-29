const prisma = require('./db');
async function checkSellers() {
    try {
        const statusCounts = await prisma.property.groupBy({
            by: ['status'],
            where: { seller_name: { contains: 'Trio', mode: 'insensitive' } },
            _count: { id: true }
        });
        console.log('--- Trio-related Status counts ---');
        console.log(JSON.stringify(statusCounts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkSellers();
