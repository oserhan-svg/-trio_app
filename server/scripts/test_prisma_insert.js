const prisma = require('../db');

async function testFeatures() {
    console.log('--- DB & PRISMA TEST ---');
    try {
        // 1. Prisma Insert Test
        console.log('1. Attempting Direct Prisma Insert...');
        const newContact = await prisma.pendingContact.create({
            data: {
                name: "Direct DB Test",
                phone: "+905550009988",
                email: "dbtest@example.com",
                notes: "Direct Insert",
                consultant_id: 3 // Admin user ID from previous dump
            }
        });
        console.log('   Success! Inserted ID:', newContact.id);

        // 2. Count Check
        const count = await prisma.pendingContact.count();
        console.log('2. Current Count in DB:', count);

    } catch (e) {
        console.error('   FAIL:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFeatures();
