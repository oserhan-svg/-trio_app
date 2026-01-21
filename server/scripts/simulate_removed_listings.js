const prisma = require('../db');

async function markSomeAsRemoved() {
    try {
        // Find 5 random active properties
        const properties = await prisma.property.findMany({
            where: { status: 'active' },
            take: 5
        });

        if (properties.length === 0) {
            console.log('No active properties found.');
            return;
        }

        const ids = properties.map(p => p.id);
        console.log('Marking IDs as removed:', ids);

        const result = await prisma.property.updateMany({
            where: { id: { in: ids } },
            data: { status: 'removed' }
        });

        console.log(`Updated ${result.count} properties to 'removed'.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

markSomeAsRemoved();
