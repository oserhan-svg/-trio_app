const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking is_primary status for active Trio listings\n');

    const activeTrioListings = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' },
            status: 'active'
        },
        select: {
            id: true,
            title: true,
            is_primary: true,
            url: true,
            price: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`📊 Total Active Trio Listings: ${activeTrioListings.length}\n`);

    const primaryListings = activeTrioListings.filter(p => p.is_primary);
    const nonPrimaryListings = activeTrioListings.filter(p => !p.is_primary);

    console.log(`✅ PRIMARY (is_primary=true): ${primaryListings.length}`);
    console.log(`❌ NON-PRIMARY (is_primary=false): ${nonPrimaryListings.length}\n`);

    console.log('📋 PRIMARY Listings (what users should see):');
    primaryListings.forEach(p => {
        const platform = p.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
        console.log(`  - ID ${p.id}: ${p.title.substring(0, 60)}... (${platform})`);
    });

    if (nonPrimaryListings.length > 0) {
        console.log('\n📋 NON-PRIMARY Listings (hidden duplicates):');
        nonPrimaryListings.forEach(p => {
            const platform = p.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
            console.log(`  - ID ${p.id}: ${p.title.substring(0, 60)}... (${platform})`);
        });
    }
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
