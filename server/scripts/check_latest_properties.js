const prisma = require('../db');

async function checkLatestProperties() {
    try {
        const totalCount = await prisma.property.count();
        console.log(`Total Properties: ${totalCount}`);

        const latest = await prisma.property.findMany({
            take: 10,
            orderBy: {
                created_at: 'desc'
            },
            select: {
                id: true,
                title: true,
                url: true,
                created_at: true,
                last_scraped: true,
                district: true,
                neighborhood: true
            }
        });

        console.log('\n--- 10 Most Recently Created Properties ---');
        latest.forEach(p => {
            console.log(`[${p.created_at.toISOString()}] ${p.title} (${p.district}/${p.neighborhood}) - ${p.url}`);
        });

        const recentlyUpdated = await prisma.property.findMany({
            take: 10,
            orderBy: {
                last_scraped: 'desc'
            },
            select: {
                id: true,
                title: true,
                last_scraped: true
            }
        });

        console.log('\n--- 10 Most Recently Scraped/Updated Properties ---');
        recentlyUpdated.forEach(p => {
            console.log(`[${p.last_scraped ? p.last_scraped.toISOString() : 'N/A'}] ${p.title}`);
        });

    } catch (error) {
        console.error('Error checking properties:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestProperties();
