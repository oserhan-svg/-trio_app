const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reassign() {
    try {
        console.log('--- Starting Re-assignment ---');

        const userMap = {
            'Ozancan Serhan': 76,
            'Raif Aslan': 77,
            'Arzu Serhan': 78,
            'Kanat Kubat': 68
        };

        for (const [name, id] of Object.entries(userMap)) {
            const result = await prisma.property.updateMany({
                where: {
                    seller_name: { contains: name, mode: 'insensitive' },
                    seller_type: 'office'
                },
                data: {
                    assigned_user_id: id
                }
            });
            console.log(`Re-assigned ${result.count} properties to ${name} (ID: ${id})`);
        }

        console.log('--- Re-assignment Complete ---');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reassign();
