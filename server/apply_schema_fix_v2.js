const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finishUpdate() {
    const existingTables = [
        'property_history',
        'demands',
        'deals'
    ];

    try {
        console.log('--- Finishing Manual Schema Update ---');

        for (const table of existingTables) {
            try {
                console.log(`Checking/Updating ${table}...`);
                if (table === 'property_history') {
                    await prisma.$executeRaw`ALTER TABLE "property_history" ALTER COLUMN "price" TYPE DECIMAL(15, 2);`;
                } else if (table === 'demands') {
                    await prisma.$executeRaw`ALTER TABLE "demands" ALTER COLUMN "min_price" TYPE DECIMAL(15, 2);`;
                    await prisma.$executeRaw`ALTER TABLE "demands" ALTER COLUMN "max_price" TYPE DECIMAL(15, 2);`;
                } else if (table === 'deals') {
                    await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "sale_price" TYPE DECIMAL(15, 2);`;
                    await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "commission_amount" TYPE DECIMAL(15, 2);`;
                    await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "consultant_share" TYPE DECIMAL(15, 2);`;
                }
                console.log(`✅ ${table} updated.`);
            } catch (e) {
                console.warn(`⚠️ Failed to update ${table}: ${e.message}`);
            }
        }

        console.log('--- Final Generate ---');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

finishUpdate();
