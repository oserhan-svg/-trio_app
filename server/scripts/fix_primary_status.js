const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing is_primary status for active Trio agency listings\n');

    // Find all active Trio listings that are NOT primary
    const nonPrimaryListings = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active',
            is_primary: false
        },
        select: {
            id: true,
            title: true,
            url: true
        }
    });

    console.log(`📊 Found ${nonPrimaryListings.length} non-primary active Trio listings\n`);

    if (nonPrimaryListings.length === 0) {
        console.log('✅ All active Trio listings are already marked as primary');
        return;
    }

    console.log('📋 Listings to be updated:');
    nonPrimaryListings.forEach(p => {
        const platform = p.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
        console.log(`  - ID ${p.id}: ${p.title.substring(0, 60)}... (${platform})`);
    });

    console.log('\n🔄 Updating to is_primary=true...');

    const result = await prisma.property.updateMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active',
            is_primary: false
        },
        data: {
            is_primary: true
        }
    });

    console.log(`\n✅ Successfully updated ${result.count} listings to is_primary=true`);

    // Verify
    const verifyPrimary = await prisma.property.count({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active',
            is_primary: true
        }
    });

    console.log(`\n📊 Total active Trio listings now marked as primary: ${verifyPrimary}`);
    console.log('\n🎉 All active Trio agency listings are now visible in the portfolio!');
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
