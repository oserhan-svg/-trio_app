const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Migrating NULL seller_types to "office"...');
        const result = await prisma.property.updateMany({
            where: { seller_type: null },
            data: { seller_type: 'office' }
        });
        console.log(`✅ Migrated ${result.count} records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
