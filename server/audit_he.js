require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditHepsiemlak() {
    try {
        const activeHE = await prisma.property.findMany({
            where: {
                url: { contains: 'hepsiemlak.com' },
                status: 'active'
            },
            include: {
                assigned_user: true
            }
        });

        console.log(`Total Active Hepsiemlak in DB: ${activeHE.length} (Target: 27)`);

        const byUser = {};
        activeHE.forEach(p => {
            const userName = p.assigned_user ? p.assigned_user.name : 'Unassigned';
            byUser[userName] = (byUser[userName] || 0) + 1;
        });

        console.log('Breakdown by Consultant:');
        console.table(byUser);

        const missingInfo = activeHE.filter(p => !p.seller_phone || !p.description);
        console.log(`Hepsiemlak listings with missing info: ${missingInfo.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

auditHepsiemlak();
