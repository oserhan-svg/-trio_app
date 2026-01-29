const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- Checking Trio Listings ---');

        // 1. Check Count of assigned listings to ID 1
        const adminListings = await prisma.property.count({
            where: { assigned_user_id: 1 }
        });
        console.log(`Properties assigned to User ID 1: ${adminListings}`);

        // 2. Check recent scrapes (last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentScrapes = await prisma.property.findMany({
            where: {
                last_scraped: { gte: oneHourAgo },
                url: { contains: 'trioemlak' }
            },
            take: 5,
            select: { id: true, title: true, assigned_user_id: true, status: true }
        });

        console.log(`Recently scraped Trio properties: ${recentScrapes.length}`);
        recentScrapes.forEach(p => console.log(p));

        // 3. Check Users to confirm Admin ID
        const admin = await prisma.user.findUnique({ where: { id: 1 } });
        console.log('User ID 1:', admin ? admin.email : 'NOT FOUND');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
