const prisma = require('./db');

async function testStats() {
    try {
        console.log('Testing DB connection...');
        const total = await prisma.property.count();
        console.log('Total Properties:', total);

        const assigned = await prisma.property.count({
            where: { assigned_user_id: { not: null } }
        });
        console.log('Assigned:', assigned);

        const sCount = await prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        });
        console.log('Sahibinden:', sCount);

        console.log('Test successful');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStats();
