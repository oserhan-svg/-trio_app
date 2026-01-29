const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    try {
        console.log('--- CHECKING ASSIGNMENT & SELLER TYPE DISTRIBUTION ---');
        const active = await prisma.property.count({ where: { status: 'active' } });
        const primary = await prisma.property.count({ where: { status: 'active', is_primary: true } });

        const assigned = await prisma.property.count({ where: { status: 'active', assigned_user_id: { not: null } } });
        const office = await prisma.property.count({ where: { status: 'active', seller_type: 'office' } });
        const owner = await prisma.property.count({ where: { status: 'active', seller_type: 'owner' } });

        const assignedPrimary = await prisma.property.count({ where: { status: 'active', is_primary: true, assigned_user_id: { not: null } } });
        const officePrimary = await prisma.property.count({ where: { status: 'active', is_primary: true, seller_type: 'office' } });

        console.log('Active Total:', active);
        console.log('Active & Primary:', primary);
        console.log('Active & Assigned:', assigned);
        console.log('Active & Office:', office);
        console.log('Active & Owner:', owner);
        console.log('Active, Primary & Assigned:', assignedPrimary);
        console.log('Active, Primary & Office:', officePrimary);

        if (assignedPrimary === 33 || officePrimary === 33) {
            console.log('\n🎯 FOUND THE MATCH!');
            if (assignedPrimary === 33) console.log('The user likely has a filter for "Assigned Listings" (Portfolio Mode) active.');
            if (officePrimary === 33) console.log('The user likely has a filter for "Office Listings" active.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
