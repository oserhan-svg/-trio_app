const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteBilinmiyor() {
    try {
        const user = await prisma.user.findFirst({
            where: { name: 'Bilinmiyor' }
        });

        if (!user) {
            console.log('❌ User "Bilinmiyor" not found.');
            return;
        }

        console.log(`Found user: ${user.name} (ID: ${user.id})`);

        // Check listings
        const count = await prisma.property.count({
            where: { assigned_user_id: user.id }
        });
        console.log(`User has ${count} assigned properties.`);

        if (count > 0) {
            console.log('Unassigning properties...');
            await prisma.property.updateMany({
                where: { assigned_user_id: user.id },
                data: { assigned_user_id: null }
            });
            console.log('✅ Properties unassigned.');
        }

        console.log('Deleting user...');
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log('✅ User "Bilinmiyor" deleted successfully.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

deleteBilinmiyor();
