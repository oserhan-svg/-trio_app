const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const total = await prisma.property.count();
        const officeType = await prisma.property.count({ where: { seller_type: 'office' } });
        const assigned = await prisma.property.count({ where: { assigned_user_id: { not: null } } });
        const officeAndAssigned = await prisma.property.count({
            where: {
                seller_type: 'office',
                assigned_user_id: { not: null }
            }
        });

        console.log('--- PORTFOLIO DATA DEBUG ---');
        console.log('Total:', total);
        console.log("Seller Type 'office':", officeType);
        console.log("Assigned User ID != null:", assigned);
        console.log("Office & Assigned (Agency Portfolio Condition):", officeAndAssigned);

        // Sample some records
        const sample = await prisma.property.findMany({
            take: 5,
            select: { id: true, seller_type: true, assigned_user_id: true, url: true }
        });
        console.log('Sample Records:', sample);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
