const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to create a client with type...');
    try {
        const client = await prisma.client.create({
            data: {
                name: 'Debug User2',
                type: 'seller', // Test the new field
                consultant_id: 1 // Assuming user ID 1 exists (admin usually)
            }
        });
        console.log('Success:', client);
    } catch (e) {
        console.error('Failure:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
