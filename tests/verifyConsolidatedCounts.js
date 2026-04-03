const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCounts() {
    try {
        console.log('--- Verifying Consolidated Counts ---');

        // Original logic
        const totalPrisma = await prisma.property.count();
        const sahibindenPrisma = await prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        });
        const hepsiemlakPrisma = await prisma.property.count({
            where: {
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        });
        const emlakjetPrisma = await prisma.property.count({
            where: { url: { contains: 'emlakjet.com' } }
        });
        const assignedPrisma = await prisma.property.count({
            where: { assigned_user_id: { not: null } }
        });

        console.log('Prisma counts:', {
            total: totalPrisma,
            sahibinden: sahibindenPrisma,
            hepsiemlak: hepsiemlakPrisma,
            emlakjet: emlakjetPrisma,
            assigned: assignedPrisma
        });

        // New logic
        const countsResult = await prisma.$queryRaw`
            SELECT
                COUNT(*)::int as "total",
                COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%')::int as "sahibinden",
                COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%')::int as "hepsiemlak",
                COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%')::int as "emlakjet",
                COUNT(*) FILTER (WHERE assigned_user_id IS NOT NULL)::int as "assigned"
            FROM "properties"
        `;
        const countsRaw = countsResult[0];

        console.log('Raw SQL counts:', countsRaw);

        const match = totalPrisma === countsRaw.total &&
                      sahibindenPrisma === countsRaw.sahibinden &&
                      hepsiemlakPrisma === countsRaw.hepsiemlak &&
                      emlakjetPrisma === countsRaw.emlakjet &&
                      assignedPrisma === countsRaw.assigned;

        if (match) {
            console.log('✅ COUNTS MATCH!');
        } else {
            console.error('❌ COUNTS MISMATCH!');
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification failed:', error);
        // If DB is not available, we might get an error here.
    } finally {
        await prisma.$disconnect();
    }
}

verifyCounts();
