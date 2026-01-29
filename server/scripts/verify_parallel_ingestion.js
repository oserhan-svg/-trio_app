const prisma = require('../db');

async function verify() {
    try {
        console.log('--- 📊 PARALLEL INGESTION VERIFICATION ---');

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Check counts per provider updated in the last hour
        const providers = ['sh-', 'he-', 'ej-'];
        const providerNames = {
            'sh-': 'Sahibinden',
            'he-': 'Hepsiemlak',
            'ej-': 'Emlakjet'
        };

        for (const prefix of providers) {
            const count = await prisma.property.count({
                where: {
                    external_id: { startsWith: prefix },
                    last_scraped: { gte: oneHourAgo }
                }
            });
            console.log(`✅ ${providerNames[prefix]}: ${count} listings updated in the last 60 mins`);
        }

        const totalRecent = await prisma.property.count({
            where: { last_scraped: { gte: oneHourAgo } }
        });
        console.log(`\n📦 Total fresh items: ${totalRecent}`);
        console.log('------------------------------------------');

    } catch (e) {
        console.error('❌ Verification Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
