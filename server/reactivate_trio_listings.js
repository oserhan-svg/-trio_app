const prisma = require('./db');

async function reactivate() {
    try {
        console.log('🚀 Reactivating Trio listings...');

        const result = await prisma.property.updateMany({
            where: {
                seller_name: { contains: 'Trio', mode: 'insensitive' },
                status: 'removed'
            },
            data: {
                status: 'active',
                last_scraped: new Date() // Reset stale timer
            }
        });

        console.log(`✅ Success: ${result.count} listings reactivated to "active" status.`);
    } catch (e) {
        console.error('❌ Failed to reactivate listings:', e);
    } finally {
        await prisma.$disconnect();
    }
}

reactivate();
