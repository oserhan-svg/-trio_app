const prisma = require('../db');

async function checkStatuses() {
    try {
        const counts = await prisma.property.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        console.log('--- Property Status Counts ---');
        console.table(counts);

        // Also check if there are null statuses
        const nullStatus = await prisma.property.count({
            where: { status: null }
        });
        console.log('Null Status Count:', nullStatus);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatuses();
