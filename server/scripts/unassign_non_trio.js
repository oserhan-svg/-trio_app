const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unassignNonTrio() {
    console.log('🧹 Starting cleanup of misassigned portfolio listings...');

    // We want to unassign properties that:
    // 1. Are assigned to ANY user (or specifically Admin)
    // 2. Do NOT have "Trio" in their seller_name

    const misassigned = await prisma.property.findMany({
        where: {
            assigned_user_id: { not: null },
            NOT: {
                seller_name: { contains: 'trio', mode: 'insensitive' }
            }
        },
        select: { id: true, title: true, seller_name: true }
    });

    console.log(`🔍 Found ${misassigned.length} properties to unassign.`);

    if (misassigned.length === 0) {
        console.log('✅ No misassigned properties found.');
        return;
    }

    const ids = misassigned.map(p => p.id);

    const result = await prisma.property.updateMany({
        where: {
            id: { in: ids }
        },
        data: {
            assigned_user_id: null,
            is_primary: false // Also reset primary status for these
        }
    });

    console.log(`✅ Successfully unassigned ${result.count} properties.`);
}

unassignNonTrio()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
