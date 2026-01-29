const prisma = require('../db');

async function debugUngrouped() {
    const ungroupedDetails = await prisma.property.findMany({
        where: { group_id: null, assigned_user_id: { not: null }, seller_type: 'office' },
        select: { id: true, title: true, neighborhood: true, rooms: true, size_m2: true }
    });

    console.log(`Total Ungrouped: ${ungroupedDetails.length}`);
    console.log('Ungrouped Properties detail check:');
    ungroupedDetails.forEach(p => {
        const missing = [];
        if (!p.neighborhood) missing.push('neighborhood');
        if (!p.rooms) missing.push('rooms');
        if (!p.size_m2) missing.push('size_m2');

        console.log(`- ID ${p.id}: ${p.title.substring(0, 30)}... | N: ${p.neighborhood || 'MISSING'}, R: ${p.rooms || 'MISSING'}, S: ${p.size_m2 || 'MISSING'}`);
    });

    await prisma.$disconnect();
}

debugUngrouped();
