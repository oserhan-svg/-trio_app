const prisma = require('../db');

async function debugCounts() {
    const total = await prisma.property.count({
        where: { assigned_user_id: { not: null }, seller_type: 'office' }
    });

    const ungrouped = await prisma.property.count({
        where: { group_id: null, assigned_user_id: { not: null }, seller_type: 'office' }
    });

    const primary = await prisma.property.count({
        where: { is_primary: true, assigned_user_id: { not: null }, seller_type: 'office' }
    });

    const uniqueGroups = await prisma.property.groupBy({
        by: ['group_id'],
        where: { group_id: { not: null }, assigned_user_id: { not: null }, seller_type: 'office' }
    });

    console.log({
        total,
        ungrouped,
        primary,
        uniqueGroups: uniqueGroups.length
    });

    await prisma.$disconnect();
}

debugCounts();
