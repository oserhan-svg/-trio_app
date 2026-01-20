const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const nonPrimary = await prisma.property.findMany({
        where: { is_primary: false },
        take: 20,
        select: { group_id: true }
    });

    const uniqueGroupIds = [...new Set(nonPrimary.map(p => p.group_id).filter(Boolean))];

    console.log('Sample Duplicate Groups:');
    for (const groupId of uniqueGroupIds) {
        const members = await prisma.property.findMany({
            where: { group_id: groupId },
            select: { id: true, title: true, price: true, size_m2: true, rooms: true, district: true, neighborhood: true, url: true, is_primary: true }
        });
        console.log(`Group ${groupId}: (${members.length} members)`);
        members.forEach(m => {
            console.log(`  - [${m.is_primary ? 'P' : 'S'}] ID: ${m.id}, Price: ${m.price}, Size: ${m.size_m2}, Rooms: ${m.rooms}, Dist: ${m.district}, Neigh: ${m.neighborhood}, Title: ${m.title}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
