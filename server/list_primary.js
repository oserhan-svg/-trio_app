const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- LISTING TOP 100 PRIMARY LISTINGS ---');
        const listings = await prisma.property.findMany({
            where: { status: 'active', is_primary: true },
            take: 100,
            select: { id: true, title: true, url: true, district: true }
        });

        console.log('Found:', listings.length, 'primary listings in this sample.');
        listings.forEach(l => {
            console.log(`[${l.id}] ${l.title} (${l.district}) - ${l.url.substring(0, 40)}...`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
