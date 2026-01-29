const prisma = require('./db');

async function repair() {
    try {
        const user = await prisma.user.findUnique({ where: { id: 3 } });
        console.log(`User 3: ${user.name} (${user.email})`);

        const assigned = await prisma.property.findMany({
            where: { assigned_user_id: 3 },
            select: { id: true, seller_name: true, title: true }
        });

        const toRemove = [];
        for (const p of assigned) {
            const s = (p.seller_name || '').toLowerCase();
            if (!s.includes('trio') && !s.includes('ozancan')) {
                toRemove.push(p.id);
                console.log(`[Marked for Removal] ID:${p.id} Seller:${p.seller_name} Title:${p.title}`);
            }
        }

        console.log(`Found ${toRemove.length} listings to unassign.`);

        if (toRemove.length > 0) {
            const res = await prisma.property.updateMany({
                where: { id: { in: toRemove } },
                data: { assigned_user_id: null, is_primary: false }
            });
            console.log(`Unassigned ${res.count} listings.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

repair();
