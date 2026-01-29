const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAssignments() {
    try {
        console.log('--- Fixing Assignments by Seller Name ---');

        const consultants = [
            { id: 76, name: 'Ozancan Serhan' },
            { id: 68, name: 'Kanat Kubat' },
            { id: 78, name: 'Arzu Serhan' }
        ];

        for (const c of consultants) {
            console.log(`Checking listings for: ${c.name} (ID: ${c.id})`);

            // Find listings where seller_name matches but assigned_user_id is wrong or null
            const listings = await prisma.property.findMany({
                where: {
                    seller_name: { contains: c.name, mode: 'insensitive' },
                    OR: [
                        { assigned_user_id: null },
                        { assigned_user_id: 3 } // Admin fallback
                    ]
                }
            });

            if (listings.length > 0) {
                console.log(`Found ${listings.length} listings to re-assign to ${c.name}.`);
                const ids = listings.map(l => l.id);

                await prisma.property.updateMany({
                    where: { id: { in: ids } },
                    data: { assigned_user_id: c.id }
                });

                console.log(`✅ Updated ${listings.length} listings.`);
            } else {
                console.log(`No mismatched listings found for ${c.name}.`);
            }
        }

        // Special check: Ozancan might be mentioned as "Ozancan"
        const partialMatch = await prisma.property.findMany({
            where: {
                seller_name: { contains: 'Ozancan', mode: 'insensitive' },
                assigned_user_id: { not: 76 }
            }
        });
        if (partialMatch.length > 0) {
            console.log(`Found ${partialMatch.length} partial matches for Ozancan. Fixing...`);
            await prisma.property.updateMany({
                where: { id: { in: partialMatch.map(l => l.id) } },
                data: { assigned_user_id: 76 }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixAssignments();
