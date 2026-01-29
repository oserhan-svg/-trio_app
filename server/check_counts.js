const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const total = await prisma.property.count();
        const active = await prisma.property.count({ where: { status: 'active' } });
        const primary = await prisma.property.count({ where: { is_primary: true } });
        const activePrimary = await prisma.property.count({ where: { status: 'active', is_primary: true } });

        console.log('--- DATABASE STATUS ---');
        console.log('Total Properties:', total);
        console.log('Active Properties:', active);
        console.log('Primary Properties:', primary);
        console.log('Active & Primary Properties:', activePrimary);

        if (active > 0 && activePrimary === 0) {
            console.log('\nWARNING: You have active properties but NONE are marked as primary.');
            console.log('This is why they are not showing up in the default view.');
        }
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
