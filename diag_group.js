const prisma = require('./server/db');

async function check() {
    try {
        const groupId = 'bd8a46e9-dda5-4121-b0ae-39f1bedf7039';
        const g = await prisma.property.findMany({
            where: { group_id: groupId }
        });
        console.log('Group ID:', groupId);
        console.log(JSON.stringify(g.map(p => ({
            id: p.id,
            title: p.title,
            status: p.status,
            is_primary: p.is_primary,
            seller_name: p.seller_name
        })), null, 2));

        const primaryCount = g.filter(p => p.is_primary).length;
        console.log('Primary Count in this group:', primaryCount);

        const activeCount = g.filter(p => p.status === 'active').length;
        console.log('Active Count in this group:', activeCount);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
