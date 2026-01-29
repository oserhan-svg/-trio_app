const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboardQuery() {
    console.log('--- Testing Dashboard Default Query ---');

    // Mimic propertyController logic for default filters
    // page=1, limit=50, seller_type=all, listingType=all, sort=newest

    // Logic from controller:
    const where = { AND: [] };

    // Status default
    where.AND.push({ status: 'active' });

    console.log('Query "where":', JSON.stringify(where, null, 2));

    try {
        const count = await prisma.property.count({ where });
        console.log(`Total Matches: ${count}`);

        const properties = await prisma.property.findMany({
            where,
            orderBy: { created_at: 'desc' }, // sort=newest
            take: 5,
            select: { id: true, title: true, price: true }
        });

        console.log('Top 5 Properties:', properties);
    } catch (error) {
        console.error('Query Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardQuery();
