const prisma = require('../db');

async function analyzeRooms() {
    try {
        const result = await prisma.property.groupBy({
            by: ['rooms'],
            _count: { rooms: true },
            orderBy: { _count: { rooms: 'desc' } },
            take: 50
        });
        console.log('Top Room Strings:', result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeRooms();
