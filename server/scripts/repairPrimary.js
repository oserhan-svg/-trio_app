const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Primary Listing Repair...');

    // 1. Find all group_ids
    const groups = await prisma.property.groupBy({
        by: ['group_id']
    });

    const groupIds = groups.map(g => g.group_id).filter(Boolean);
    console.log(`Found ${groupIds.length} unique groups.`);

    let fixedGroups = 0;
    let multiplePrimaryGroups = 0;

    for (const groupId of groupIds) {
        // Find existing primaries in this group
        const primaries = await prisma.property.findMany({
            where: { group_id: groupId, is_primary: true },
            select: { id: true }
        });

        if (primaries.length === 0) {
            // Case 1: No primary. Pick the oldest one.
            const oldest = await prisma.property.findFirst({
                where: { group_id: groupId },
                orderBy: { created_at: 'asc' }
            });

            if (oldest) {
                await prisma.property.update({
                    where: { id: oldest.id },
                    data: { is_primary: true }
                });
                fixedGroups++;
            }
        } else if (primaries.length > 1) {
            // Case 2: Multiple primaries. (Insurance)
            // Keep the oldest one as primary, set others to false.
            const oldestPrimaryId = primaries[0].id; // Simplified, not necessarily oldest but we just need one.

            await prisma.property.updateMany({
                where: {
                    group_id: groupId,
                    id: { not: oldestPrimaryId }
                },
                data: { is_primary: false }
            });
            multiplePrimaryGroups++;
        }
    }

    // 3. Properties with NO group_id should ALWAYS be primary
    const ungroupedNonPrimary = await prisma.property.updateMany({
        where: { group_id: null, is_primary: false },
        data: { is_primary: true }
    });

    console.log(`\nRepair Summary:`);
    console.log(`- Groups fixed (missing primary): ${fixedGroups}`);
    console.log(`- Groups cleaned (multiple primaries): ${multiplePrimaryGroups}`);
    console.log(`- Ungrouped properties set to primary: ${ungroupedNonPrimary.count}`);

    // Final Counts
    const total = await prisma.property.count();
    const primaryActive = await prisma.property.count({ where: { status: 'active', is_primary: true } });
    console.log(`- Total properties: ${total}`);
    console.log(`- New Primary Active count: ${primaryActive}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
