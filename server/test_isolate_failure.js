require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const where = {}; // simulates admin view
    const page = 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const take = limit;

    try {
        console.log('1. Testing total count...');
        const total = await prisma.client.count({ where });
        console.log('Total:', total);

        console.log('2. Testing findMany...');
        const clients = await prisma.client.findMany({
            where,
            include: { demands: true, consultant: { select: { email: true } } },
            orderBy: { created_at: 'desc' },
            skip,
            take
        });
        console.log('Clients count:', clients.length);

        console.log('3. Testing active buyers count...');
        const activeBuyers = await prisma.client.count({
            where: {
                ...where,
                OR: [{ type: 'buyer' }],
                status: 'Active'
            }
        });
        console.log('Active Buyers:', activeBuyers);

        console.log('4. Testing active sellers count...');
        const activeSellers = await prisma.client.count({
            where: {
                ...where,
                type: 'seller',
                status: 'Active'
            }
        });
        console.log('Active Sellers:', activeSellers);

        console.log('5. Testing new this month count...');
        const newThisMonth = await prisma.client.count({
            where: {
                ...where,
                created_at: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });
        console.log('New this month:', newThisMonth);

    } catch (e) {
        console.error('Test failed at some point:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
