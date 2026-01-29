const prisma = require('./db');

async function countByUser() {
    try {
        const counts = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            _count: {
                id: true
            }
        });

        console.log('Listing Counts by User:');
        for (const c of counts) {
            const userId = c.assigned_user_id;
            const count = c._count.id;
            let userName = 'Unassigned';
            if (userId) {
                const u = await prisma.user.findUnique({ where: { id: userId } });
                userName = u ? `${u.name} (${u.role})` : `Unknown User ${userId}`;
            }
            console.log(`User: ${userName} [ID: ${userId}] -> Count: ${count}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

countByUser();
