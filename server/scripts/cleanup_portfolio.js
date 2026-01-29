const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        console.log('--- Starting Portfolio Cleanup ---');

        const result = await prisma.property.updateMany({
            where: {
                assigned_user_id: { not: null },
                seller_type: 'owner'
            },
            data: {
                assigned_user_id: null
            }
        });

        console.log(`Successfully unassigned ${result.count} owner listings from the portfolio.`);
        console.log('--- Cleanup Complete ---');
    } catch (error) {
        console.error('Cleanup Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
