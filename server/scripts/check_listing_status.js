const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking all Trio listings with status breakdown\n');

    // All assigned Trio listings (regardless of status)
    const allTrioAssigned = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            seller_type: 'office',
            seller_name: { contains: 'trio', mode: 'insensitive' }
        },
        select: {
            id: true,
            title: true,
            status: true,
            price: true,
            url: true
        }
    });

    console.log('📊 Total Assigned Trio Listings:', allTrioAssigned.length);

    // Group by status
    const statusGroups = allTrioAssigned.reduce((acc, prop) => {
        const status = prop.status || 'unknown';
        if (!acc[status]) acc[status] = [];
        acc[status].push(prop);
        return acc;
    }, {});

    console.log('\n📋 Breakdown by Status:');
    Object.keys(statusGroups).forEach(status => {
        console.log(`  ${status}: ${statusGroups[status].length} listings`);
    });

    // Show active listings
    if (statusGroups['active']) {
        console.log('\n✅ Active Listings:');
        statusGroups['active'].forEach(p => {
            const platform = p.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
            console.log(`  - ID ${p.id}: ${p.title.substring(0, 50)}... (${platform})`);
        });
    }

    // Show removed listings
    if (statusGroups['removed']) {
        console.log('\n❌ Removed Listings:');
        statusGroups['removed'].forEach(p => {
            const platform = p.url.includes('sahibinden') ? 'Sahibinden' : 'Hepsiemlak';
            console.log(`  - ID ${p.id}: ${p.title.substring(0, 50)}... (${platform})`);
        });
    }
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => prisma.$disconnect());
