require('dotenv').config();
const prisma = require('./db');

async function fixKubatFull() {
    console.log('--- Applying Fix for Kubat Kanat (User 68) ---');
    try {
        // 1. Update User Profile
        // Note: Scraper found "Kanat Kubat", we have "Kubat Kanat". Keeping "Kubat Kanat" but adding phone/img.
        const phone = '05524731021'; // Normalized
        const img = 'https://image5.sahibinden.com/users/56/88/43/p200_profile_75568843_5150969.png';

        const updatedUser = await prisma.user.update({
            where: { id: 68 },
            data: {
                phone: phone,
                profile_picture: img
            }
        });
        console.log('✅ User Updated:', updatedUser.name, updatedUser.phone);

        // 2. Find and Assign Listings by Phone
        // Need to be careful with phone format matching. 
        // Database seller_phone might be formatted differently or just contain the number.
        // We'll search for contains "552 473 10 21" or "5524731021" variants.

        const searchPhone1 = '552 473 10 21';
        const searchPhone2 = '5524731021';
        const searchPhone3 = '0552 473 10 21';

        const listings = await prisma.property.findMany({
            where: {
                OR: [
                    { seller_phone: { contains: searchPhone1 } },
                    { seller_phone: { contains: searchPhone2 } },
                    { seller_phone: { contains: searchPhone3 } },
                    // Also try name reversed just in case
                    { seller_name: { contains: 'Kanat Kubat', mode: 'insensitive' } }
                ],
                assigned_user_id: { not: 68 } // Only find unassigned or wrongly assigned
            }
        });

        console.log(`Found ${listings.length} listings to assign.`);

        if (listings.length > 0) {
            const ids = listings.map(l => l.id);
            const updateRes = await prisma.property.updateMany({
                where: { id: { in: ids } },
                data: { assigned_user_id: 68 }
            });
            console.log(`✅ Assigned ${updateRes.count} listings to User 68.`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixKubatFull();
