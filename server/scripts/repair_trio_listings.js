const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    try {
        console.log('--- Repairing Trio Listings ---');

        const result = await prisma.property.updateMany({
            where: {
                url: { contains: 'trioemlak' }
            },
            data: {
                assigned_user_id: 3,
                is_primary: true
            }
        });

        console.log(`✅ Updated ${result.count} listings to be owned by Admin (ID: 3).`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

repair();
