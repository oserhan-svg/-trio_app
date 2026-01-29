const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Portfolio Filter Verification\n');

    // Count agency portfolio (what should show in İlanlarım)
    const agencyPortfolio = await prisma.property.count({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' }
        }
    });

    // Count non-Trio office listings that are still assigned
    const nonTrioAssigned = await prisma.property.count({
        where: {
            seller_type: 'office',
            NOT: { seller_name: { contains: 'trio', mode: 'insensitive' } },
            assigned_user_id: { not: null }
        }
    });

    // Sample of agency portfolio listings
    const sampleListings = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' }
        },
        select: {
            id: true,
            title: true,
            seller_name: true,
            assigned_user_id: true
        },
        take: 5
    });

    console.log('✅ Agency Portfolio (Trio Listings):', agencyPortfolio);
    console.log('❌ Non-Trio Office Listings Still Assigned:', nonTrioAssigned);
    console.log('\n📋 Sample Agency Listings:');
    console.log(JSON.stringify(sampleListings, null, 2));
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
