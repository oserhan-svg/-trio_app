const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalAudit() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true }
        });
        console.log('--- User List ---');
        console.table(users);

        const allProperties = await prisma.property.findMany({
            include: { assigned_user: true }
        });

        const totalCounts = {};
        allProperties.forEach(p => {
            const name = p.assigned_user ? p.assigned_user.name : 'Unassigned';
            totalCounts[name] = (totalCounts[name] || 0) + 1;
        });

        console.log('--- ALL Listings Assignment Audit (Any Status) ---');
        console.table(totalCounts);

        const ozancanListings = allProperties.filter(p => p.assigned_user_id === 76);
        console.log(`--- Ozancan Serhan (ID: 76) Details ---`);
        console.log(`Total: ${ozancanListings.length}`);
        if (ozancanListings.length > 0) {
            console.table(ozancanListings.slice(0, 5).map(l => ({ id: l.id, status: l.status, url: l.url })));
        }

        const incomplete = await prisma.property.count({
            where: {
                OR: [
                    { seller_phone: null },
                    { seller_phone: '' },
                    { description: null },
                    { description: '' }
                ],
                status: 'active'
            }
        });

        console.log(`--- Overall Progress ---`);
        console.log(`Remaining Incomplete Active Listings: ${incomplete}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

finalAudit();
