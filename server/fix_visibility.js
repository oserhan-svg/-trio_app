const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- FIXING DATABASE VISIBILITY ---');
        console.log('Target: ALL Active Properties');

        // 1. Count before
        const total = await prisma.property.count({ where: { status: 'active' } });
        const primaryBefore = await prisma.property.count({ where: { status: 'active', is_primary: true } });
        console.log(`Total Active: ${total}`);
        console.log(`Currently Primary: ${primaryBefore}`);

        // 2. Update All to is_primary = true
        console.log('Updating all active properties to is_primary=true...');
        const updateResult = await prisma.property.updateMany({
            where: { status: 'active' },
            data: { is_primary: true }
        });

        console.log(`✅ Updated ${updateResult.count} listings.`);

        // 3. Verify
        const primaryAfter = await prisma.property.count({ where: { status: 'active', is_primary: true } });
        console.log(`New Primary Count: ${primaryAfter}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
