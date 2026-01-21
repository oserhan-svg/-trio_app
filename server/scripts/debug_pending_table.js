const prisma = require('../db');

async function check() {
    console.log('--- PENDING CONTACTS DUMP ---');
    try {
        const allPending = await prisma.pendingContact.findMany();
        console.log(`Total Records: ${allPending.length}`);

        if (allPending.length > 0) {
            console.log('Sample Data:');
            allPending.forEach(p => {
                console.log(`- ID: ${p.id}, Name: ${p.name}, ConsultantID: ${p.consultant_id}`);
            });
        }

        const users = await prisma.user.findMany({ select: { id: true, email: true } });
        console.log('\n--- USERS ---');
        users.forEach(u => console.log(`ID: ${u.id} - ${u.email}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
