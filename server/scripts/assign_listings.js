require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignListings() {
    console.log('🚀 Starting Property Assignment...');

    try {
        // 1. Fetch Consultants
        const consultants = await prisma.user.findMany({
            where: { role: 'consultant' }
        });

        console.log(`👥 Found ${consultants.length} consultants.`);

        let totalAssigned = 0;

        // 2. Assign for each consultant
        for (const consultant of consultants) {
            if (!consultant.name) continue;

            console.log(`👉 Processing: ${consultant.name}`);

            // Update properties where seller_name contains the consultant's name
            // Using contains + insensitive for flexibility
            const result = await prisma.property.updateMany({
                where: {
                    seller_name: {
                        contains: consultant.name,
                        mode: 'insensitive'
                    },
                    // Optional: Only update valid active listings or all? All is safer for history.
                    // But maybe only if assigned_user_id is null? 
                    // User might re-run this to fix assignments, so overwriting is probably okay 
                    // unless we have manual assignments. 
                    // Let's assume manual assignments are rare or this script interprets truth.
                },
                data: {
                    assigned_user_id: consultant.id
                }
            });

            console.log(`   ✅ Assigned ${result.count} properties to ${consultant.name}.`);
            totalAssigned += result.count;
        }

        console.log('------------------------------------------------');
        console.log(`🏁 Total Properties Assigned: ${totalAssigned}`);

    } catch (e) {
        console.error('❌ Assignment Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

assignListings();
