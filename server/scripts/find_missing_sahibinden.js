const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for ALL Trio Emlak listings on Sahibinden\n');

    // Find ALL Sahibinden listings with "trio" in seller name
    const allTrioSahibinden = await prisma.property.findMany({
        where: {
            url: { contains: 'sahibinden' },
            seller_name: { contains: 'trio', mode: 'insensitive' }
        },
        select: {
            id: true,
            title: true,
            status: true,
            assigned_user_id: true,
            seller_type: true,
            seller_name: true,
            is_primary: true,
            created_at: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`📊 Total Trio Sahibinden Listings in Database: ${allTrioSahibinden.length}\n`);

    // Group by status
    const byStatus = {
        active: [],
        removed: [],
        other: []
    };

    allTrioSahibinden.forEach(listing => {
        if (listing.status === 'active') {
            byStatus.active.push(listing);
        } else if (listing.status === 'removed') {
            byStatus.removed.push(listing);
        } else {
            byStatus.other.push(listing);
        }
    });

    console.log('📋 Breakdown by Status:');
    console.log(`  ✅ Active: ${byStatus.active.length}`);
    console.log(`  ❌ Removed: ${byStatus.removed.length}`);
    console.log(`  ❓ Other: ${byStatus.other.length}\n`);

    // Check assignment status
    const assigned = allTrioSahibinden.filter(l => l.assigned_user_id !== null);
    const unassigned = allTrioSahibinden.filter(l => l.assigned_user_id === null);

    console.log('📋 Breakdown by Assignment:');
    console.log(`  ✅ Assigned: ${assigned.length}`);
    console.log(`  ❌ Unassigned: ${unassigned.length}\n`);

    // Check seller_type
    const office = allTrioSahibinden.filter(l => l.seller_type === 'office');
    const owner = allTrioSahibinden.filter(l => l.seller_type === 'owner');
    const other = allTrioSahibinden.filter(l => l.seller_type !== 'office' && l.seller_type !== 'owner');

    console.log('📋 Breakdown by Seller Type:');
    console.log(`  🏢 Office: ${office.length}`);
    console.log(`  👤 Owner: ${owner.length}`);
    console.log(`  ❓ Other: ${other.length}\n`);

    // Show the VISIBLE ones (active, assigned, office, primary)
    const visible = allTrioSahibinden.filter(l =>
        l.status === 'active' &&
        l.assigned_user_id !== null &&
        l.seller_type === 'office' &&
        l.is_primary === true
    );

    console.log(`\n👁️ CURRENTLY VISIBLE in Portfolio: ${visible.length}`);
    visible.forEach(l => {
        console.log(`  - ID ${l.id}: ${l.title.substring(0, 60)}...`);
    });

    // Show active but NOT assigned
    const activeUnassigned = allTrioSahibinden.filter(l =>
        l.status === 'active' &&
        l.assigned_user_id === null
    );

    if (activeUnassigned.length > 0) {
        console.log(`\n\n🚨 PROBLEM: ${activeUnassigned.length} ACTIVE Trio Sahibinden listings are NOT ASSIGNED!`);
        console.log('These need to be assigned to show up in the portfolio:\n');
        activeUnassigned.slice(0, 10).forEach(l => {
            console.log(`  - ID ${l.id}: ${l.title.substring(0, 60)}...`);
            console.log(`    Seller Type: ${l.seller_type || 'NULL'}`);
        });
        if (activeUnassigned.length > 10) {
            console.log(`  ... and ${activeUnassigned.length - 10} more`);
        }
    }

    // Show active, assigned, but wrong seller_type
    const activeAssignedWrongType = allTrioSahibinden.filter(l =>
        l.status === 'active' &&
        l.assigned_user_id !== null &&
        l.seller_type !== 'office'
    );

    if (activeAssignedWrongType.length > 0) {
        console.log(`\n\n🚨 PROBLEM: ${activeAssignedWrongType.length} listings are assigned but marked as seller_type='${activeAssignedWrongType[0].seller_type}'!`);
        console.log('These need seller_type changed to "office":\n');
        activeAssignedWrongType.slice(0, 10).forEach(l => {
            console.log(`  - ID ${l.id}: ${l.title.substring(0, 60)}...`);
            console.log(`    Current seller_type: ${l.seller_type}`);
        });
    }
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
