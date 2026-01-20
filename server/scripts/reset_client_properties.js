const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetClientProperties() {
    try {
        console.log('Resetting all client property assignments...');
        const result = await prisma.clientProperty.deleteMany({});
        console.log(`Deleted ${result.count} client property records.`);
        console.log('All "Interested Properties" lists have been cleared.');
    } catch (error) {
        console.error('Error resetting client properties:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetClientProperties();
