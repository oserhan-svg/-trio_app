const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Force live DB URL for this check
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.LIVE_DATABASE_URL,
        },
    },
});

async function main() {
    try {
        console.log('--- CHECKING LIVE DATABASE (SUPABASE) ---');
        const total = await prisma.property.count();
        const active = await prisma.property.count({ where: { status: 'active' } });

        console.log('Total Properties (Live):', total);
        console.log('Active Properties (Live):', active);

        if (total > 3000) {
            console.log('\n✅ Found the 3000+ listings in the LIVE database!');
        } else {
            console.log('\n❌ Only found', total, 'listings in the LIVE database.');
        }
    } catch (err) {
        console.error('Error querying LIVE DB:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
