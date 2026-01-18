const prisma = require('../db');

async function deleteTestListings() {
    try {
        console.log("Deleting test listings...");

        // 1. Delete history first (foreign key constraint)
        const deleteHistory = await prisma.propertyHistory.deleteMany({
            where: {
                property: {
                    title: { contains: 'TEST OWNER PRICE DROP' }
                }
            }
        });
        console.log(`Deleted ${deleteHistory.count} history records.`);

        // 2. Delete property
        const deleteProps = await prisma.property.deleteMany({
            where: {
                title: { contains: 'TEST OWNER PRICE DROP' }
            }
        });

        console.log(`Deleted ${deleteProps.count} properties.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

deleteTestListings();
