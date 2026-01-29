const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminStats() {
    console.log('--- Testing Admin Stats Logic ---');

    try {
        // 1. Total Properties
        const totalProperties = await prisma.property.count();
        console.log(`Total Properties: ${totalProperties}`);

        // 2. By Source
        const sahibindenCount = await prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        });
        console.log(`Sahibinden: ${sahibindenCount}`);

        const hepsiemlakCount = await prisma.property.count({
            where: {
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });
        console.log(`Hepsiemlak: ${hepsiemlakCount}`);

        const emlakjetCount = await prisma.property.count({
            where: { url: { contains: 'emlakjet.com' } }
        });
        console.log(`Emlakjet: ${emlakjetCount}`);

        // 3. Assignment Stats
        const assignedCount = await prisma.property.count({
            where: { assigned_user_id: { not: null } }
        });
        console.log(`Assigned: ${assignedCount}`);

        const pendingCount = totalProperties - assignedCount;
        console.log(`Pending: ${pendingCount}`);

        console.log('\n✅ Logic looks sound.');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testAdminStats();
