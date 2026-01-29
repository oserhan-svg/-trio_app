const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Advanced Primary Listing Repair (v2)...');

    // 1. Find all group_ids
    const groups = await prisma.property.groupBy({
        by: ['group_id'],
        where: { group_id: { not: null } }
    });

    const groupIds = groups.map(g => g.group_id);
    console.log(`📊 Found ${groupIds.length} unique groups to analyze.`);

    let fixedGroups = 0;
    let multiplePrimariesFixed = 0;

    for (const groupId of groupIds) {
        // Fetch ALL listings in this group to analyze state
        const groupListings = await prisma.property.findMany({
            where: { group_id: groupId },
            select: { id: true, status: true, is_primary: true, created_at: true }
        });

        const activeListings = groupListings.filter(p => p.status === 'active');
        const activePrimaries = activeListings.filter(p => p.is_primary);

        if (activeListings.length > 0) {
            // IF there are active listings, one of them MUST be primary
            if (activePrimaries.length === 0) {
                // No active primary. Promote the oldest active listing.
                const candidate = activeListings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

                await prisma.$transaction([
                    // Demote ALL other listings in group
                    prisma.property.updateMany({
                        where: { group_id: groupId, id: { not: candidate.id } },
                        data: { is_primary: false }
                    }),
                    // Promote candidate
                    prisma.property.update({
                        where: { id: candidate.id },
                        data: { is_primary: true }
                    })
                ]);
                fixedGroups++;
            } else if (activePrimaries.length > 1) {
                // Multiple active primaries. Keep one.
                const keeperId = activePrimaries[0].id;
                await prisma.property.updateMany({
                    where: { group_id: groupId, id: { not: keeperId } },
                    data: { is_primary: false }
                });
                multiplePrimariesFixed++;
            } else {
                // Exactly one active primary. Ensure no removed listings are marked primary.
                await prisma.property.updateMany({
                    where: { group_id: groupId, status: 'removed', is_primary: true },
                    data: { is_primary: false }
                });
            }
        } else {
            // NO active listings. Ensure only ONE removed listing is primary (for history consistency)
            const removedPrimaries = groupListings.filter(p => p.is_primary);
            if (removedPrimaries.length > 1) {
                const keeperId = removedPrimaries[0].id;
                await prisma.property.updateMany({
                    where: { group_id: groupId, id: { not: keeperId } },
                    data: { is_primary: false }
                });
            } else if (removedPrimaries.length === 0 && groupListings.length > 0) {
                // If all are removed, pick one to be primary just so the group isn't lost
                await prisma.property.update({
                    where: { id: groupListings[0].id },
                    data: { is_primary: true }
                });
            }
        }
    }

    // 3. Properties with NO group_id should ALWAYS be primary
    const ungroupedFix = await prisma.property.updateMany({
        where: { group_id: null, is_primary: false },
        data: { is_primary: true }
    });

    console.log(`\n✅ Repair Summary:`);
    console.log(`- Groups fixed (missing active primary): ${fixedGroups}`);
    console.log(`- Groups cleaned (multiple primaries): ${multiplePrimariesFixed}`);
    console.log(`- Ungrouped properties set to primary: ${ungroupedFix.count}`);

    // Verification
    const stats = await prisma.property.count({
        where: { status: 'active', is_primary: true }
    });
    console.log(`\n📊 New Active Primary Count: ${stats}`);
}

main()
    .catch(err => console.error('❌ Error during repair:', err))
    .finally(() => prisma.$disconnect());
