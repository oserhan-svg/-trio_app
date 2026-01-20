const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get all unique group_ids
    const groups = await prisma.property.groupBy({
        by: ['group_id'],
        _count: true
    });

    console.log(`Checking ${groups.length} groups...`);

    let missingPrimary = 0;
    for (const group of groups) {
        if (!group.group_id) continue;

        const primaryCount = await prisma.property.count({
            where: { group_id: group.group_id, is_primary: true }
        });

        if (primaryCount === 0) {
            missingPrimary++;
            if (missingPrimary <= 5) {
                console.log(`Group ${group.group_id} has NO primary listing! Total members: ${group._count}`);
                const members = await prisma.property.findMany({
                    where: { group_id: group.group_id },
                    select: { id: true, is_primary: true }
                });
                console.log('  Members:', members.map(m => `ID ${m.id} (${m.is_primary})`).join(', '));
            }
        }
    }

    console.log(`\nTotal groups with NO primary listing: ${missingPrimary}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
