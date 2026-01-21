const prisma = require('../db');

async function check() {
    try {
        const count = await prisma.pendingContact.count();
        console.log(`Total Pending Contacts: ${count}`);

        const samples = await prisma.pendingContact.findMany({ take: 5 });
        console.log('Samples:', samples);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
