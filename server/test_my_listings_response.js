const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock upgradeImages from controller
const upgradeImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images.filter(img => typeof img === 'string' && !img.startsWith('data:image'));
};

async function testMyListingsResponse(userId) {
    console.log(`\n🔍 Fetching listings for User ID: ${userId}...`);

    const properties = await prisma.property.findMany({
        where: {
            assigned_user_id: userId
        },
        orderBy: { created_at: 'desc' },
        take: 5
    });

    console.log(`Found ${properties.length} properties.`);

    if (properties.length > 0) {
        const p = properties[0];
        const upgraded = { ...p, images: upgradeImages(p.images) };

        console.log('--- Sample Property Data ---');
        console.log(`ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Price: ${p.price} (${typeof p.price})`); // Check type!
        console.log(`Location: ${p.district} / ${p.neighborhood}`);
        console.log(`Images Count: ${p.images.length}`);
        console.log(`First Image: ${upgraded.images[0]}`);
        console.log(`Auth Doc URL: ${p.auth_doc_url}`);
        console.log(`Auth End Date: ${p.auth_end_date}`);
        console.log('----------------------------');

        // Validation for MyListings.jsx requirements
        let errors = [];
        if (!p.title) errors.push('Missing Title');
        if (!p.price) errors.push('Missing Price');
        if (!upgraded.images || upgraded.images.length === 0) errors.push('Missing Images');

        if (errors.length > 0) {
            console.log('❌ Data Validation Failed:', errors);
        } else {
            console.log('✅ Data looks good for MyListings.jsx');
        }
    } else {
        console.log('⚠️ No properties found for this user.');
    }

    await prisma.$disconnect();
}

// Test for Kanat (68) and Raif (77)
(async () => {
    await testMyListingsResponse(68);
    await testMyListingsResponse(77);
})();
