
const prisma = require('../db');

async function check() {
    try {
        console.log('Connecting to DB...');

        const trioCount = await prisma.property.count({
            where: { seller_name: 'Trio Emlak' }
        });
        console.log('Trio Emlak Listings:', trioCount);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const freshCount = await prisma.property.count({
            where: { last_scraped: { gte: today } }
        });
        console.log('Listings updated today:', freshCount);

        const recent = await prisma.property.findMany({
            orderBy: { last_scraped: 'desc' },
            take: 1,
            select: { last_scraped: true }
        });
        console.log('Most recent scrape date:', recent[0]?.last_scraped);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
