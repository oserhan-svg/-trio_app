const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to DB...');
        // Test simple upsert
        const result = await prisma.systemSetting.upsert({
            where: { key: 'test_key' },
            update: { value: 'test_value' },
            create: { key: 'test_key', value: 'test_value' }
        });
        console.log('Upsert success:', result);

        const settings = await prisma.systemSetting.findMany();
        console.log('Settings in DB:', settings);
    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
