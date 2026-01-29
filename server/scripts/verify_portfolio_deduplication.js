/**
 * Portfolio Deduplication Verification Script
 * Tests that portfolio listings are properly deduplicated across platforms
 */

const prisma = require('../db');

async function verifyDeduplication() {
    console.log('\n🔍 Starting Portfolio Deduplication Verification...\n');

    try {
        // 1. Count total office listings
        const totalOfficeListings = await prisma.property.count({
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active'
            }
        });

        console.log(`📊 Total Active Office Listings (Raw): ${totalOfficeListings}`);

        // 2. Count Unique Properties (Primary Only)
        const primaryListings = await prisma.property.count({
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                is_primary: true
            }
        });

        // 3. Unique groups (Cross-posted properties)
        const uniqueGroups = await prisma.property.groupBy({
            by: ['group_id'],
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                group_id: { not: null }
            }
        });

        // 4. Count by platform
        const sahibindenCount = await prisma.property.count({
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                url: { contains: 'sahibinden.com' }
            }
        });

        const hepsiemlakCount = await prisma.property.count({
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });

        console.log(`\n📍 Platform Distribution (Raw):`);
        console.log(`   • Sahibinden.com: ${sahibindenCount} listings`);
        console.log(`   • Hepsiemlak.com: ${hepsiemlakCount} listings`);

        // 5. Find multi-portal properties
        const multiPortalGroups = await prisma.property.groupBy({
            by: ['group_id'],
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                group_id: { not: null }
            },
            _count: { id: true },
            having: {
                id: { _count: { gt: 1 } }
            }
        });

        console.log(`\n🌐 Multi-Portal Properties: ${multiPortalGroups.length}`);

        // 6. Validation checks
        console.log(`\n✅ Validation Checks:`);

        const checksPass = [];
        const checksFail = [];

        // Check 1: No group should have more than one primary listing
        const multiPrimaryCheck = await prisma.property.groupBy({
            by: ['group_id'],
            where: {
                assigned_user_id: { not: null },
                seller_type: 'office',
                status: 'active',
                is_primary: true,
                group_id: { not: null }
            },
            _count: { id: true },
            having: {
                id: { _count: { gt: 1 } }
            }
        });

        if (multiPrimaryCheck.length === 0) {
            checksPass.push('Every group has at most one primary listing');
        } else {
            checksFail.push(`Found ${multiPrimaryCheck.length} groups with multiple primary listings!`);
        }

        // Check 2: Every group should have at least one primary
        const groupsWithoutPrimary = [];
        for (const g of uniqueGroups) {
            const count = await prisma.property.count({
                where: { group_id: g.group_id, is_primary: true }
            });
            if (count === 0) groupsWithoutPrimary.push(g.group_id);
        }

        if (groupsWithoutPrimary.length === 0) {
            checksPass.push('Every group has exactly one primary listing');
        } else {
            checksFail.push(`Found ${groupsWithoutPrimary.length} groups missing a primary listing!`);
        }

        // Display results
        checksPass.forEach(check => console.log(`   ✅ ${check}`));
        checksFail.forEach(check => console.log(`   ❌ ${check}`));

        console.log(`\n${'='.repeat(70)}`);
        console.log(`Summary:`);
        console.log(`   Unique Properties: ${primaryListings}`);
        console.log(`   - Cross-Posted: ${multiPortalGroups.length}`);
        console.log(`   - Single-Portal: ${primaryListings - multiPortalGroups.length}`);
        console.log(`   Deduplication Status: ${checksFail.length === 0 ? '✅ WORKING CORRECTLY' : '❌ ISSUES FOUND'}`);
        console.log(`${'='.repeat(70)}\n`);

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDeduplication();
