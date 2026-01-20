const prisma = require('../db');

async function fixOrphanedData() {
    console.log('Checking for orphaned ClientProperty records...');

    try {
        // 1. Get all ClientProperties
        const allCPs = await prisma.clientProperty.findMany();
        console.log(`Total ClientProperty records: ${allCPs.length}`);

        let deletedCount = 0;

        for (const cp of allCPs) {
            // 2. Check if the property exists
            const propertyExists = await prisma.property.findUnique({
                where: { id: cp.property_id }
            });

            if (!propertyExists) {
                console.log(`Found orphan: client_id=${cp.client_id}, property_id=${cp.property_id}. Deleting...`);
                // 3. Delete orphan
                await prisma.clientProperty.delete({
                    where: {
                        client_id_property_id: {
                            client_id: cp.client_id,
                            property_id: cp.property_id
                        }
                    }
                });
                deletedCount++;
            }
        }

        console.log('-----------------------------------');
        console.log(`Cleanup Complete. Deleted ${deletedCount} orphaned records.`);
        console.log('Now the Client Detail page should load correctly without crashing.');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixOrphanedData();
