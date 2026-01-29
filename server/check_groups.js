const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
    console.log('--- Group Integrity Check ---');

    // Get some group IDs from secondary active listings
    const secondaryActive = await prisma.property.findMany({
        where: { status: 'active', is_primary: false, group_id: { not: null } },
        take: 10,
        select: { group_id: true }
    });

    const groupIds = [...new Set(secondaryActive.map(s => s.group_id))];

    for (const gid of groupIds) {
        const members = await prisma.property.findMany({
            where: { group_id: gid },
            select: { id: true, status: true, is_primary: true, url: true }
        });
        console.log(`Group ${gid}:`);
        console.table(members);
    }

    await prisma.$disconnect();
}

checkGroups().catch(console.error);
