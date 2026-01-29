const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE STATS ---');
    console.log('DB URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING');

    try {
        const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.log('Available models:', models.join(', '));

        const propertyCount = await prisma.property.count();
        const userCount = await prisma.user.count();
        const clientCount = await prisma.client.count();
        const listingCount = await prisma.propertyListing.count();

        console.log('\nCounts:');
        console.log('- Properties:', propertyCount);
        console.log('- Users:', userCount);
        console.log('- Clients:', clientCount);
        console.log('- Listings:', listingCount);

    } catch (e) {
        console.error('Stats failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
