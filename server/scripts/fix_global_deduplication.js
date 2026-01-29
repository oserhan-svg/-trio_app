/**
 * Global Deduplication Fixer
 * Ensures every property group has exactly one primary listing
 */

const prisma = require('../db');
const { groupProperty } = require('../services/deduplicationService');

async function fixDeduplication() {
    console.log('\n🧹 Starting Portfolio Deduplication Fix...\n');

    try {
        // 1. First, run the grouping algorithm for any property missing a group_id
        const ungrouped = await prisma.property.findMany({
            where: {
                group_id: null,
                assigned_user_id: { not: null },
                seller_type: 'office'
            }
        });

        console.log(`🔍 Found ${ungrouped.length} ungrouped office properties. Grouping now...`);
        for (const p of ungrouped) {
            await groupProperty(p.id);
        }

        // 2. Fix multiple primary listings in the same group
        console.log('⚖️ Checking for groups with multiple primary listings...');

        const groupsWithMultiPrimary = await prisma.property.groupBy({
            by: ['group_id'],
            where: {
                is_primary: true,
                group_id: { not: null },
                assigned_user_id: { not: null },
                seller_type: 'office'
            },
            _count: { id: true },
            having: {
                id: { _count: { gt: 1 } }
            }
        });

        console.log(`⚠️ Found ${groupsWithMultiPrimary.length} groups with multiple primary listings.`);

        for (const g of groupsWithMultiPrimary) {
            const members = await prisma.property.findMany({
                where: { group_id: g.group_id },
                orderBy: { created_at: 'asc' }
            });

            console.log(`   Fixing Group ${g.group_id}: Setting first member as primary, others as secondary.`);

            for (let i = 0; i < members.length; i++) {
                await prisma.property.update({
                    where: { id: members[i].id },
                    data: { is_primary: i === 0 }
                });
            }
        }

        // 3. Ensure every group has at least one primary listing
        console.log('⭐ Ensuring every group has at least one primary listing...');

        const allGroups = await prisma.property.groupBy({
            by: ['group_id'],
            where: {
                group_id: { not: null },
                assigned_user_id: { not: null },
                seller_type: 'office'
            }
        });

        let fixedMissingPrimary = 0;
        for (const g of allGroups) {
            const primaryCount = await prisma.property.count({
                where: {
                    group_id: g.group_id,
                    is_primary: true
                }
            });

            if (primaryCount === 0) {
                const oldest = await prisma.property.findFirst({
                    where: { group_id: g.group_id },
                    orderBy: { created_at: 'asc' }
                });

                if (oldest) {
                    await prisma.property.update({
                        where: { id: oldest.id },
                        data: { is_primary: true }
                    });
                    fixedMissingPrimary++;
                }
            }
        }
        console.log(`✅ Fixed ${fixedMissingPrimary} groups that were missing a primary listing.`);

        console.log('\n✨ Global Deduplication Fix Completed.');

    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDeduplication();
