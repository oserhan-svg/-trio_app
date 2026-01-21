
const prisma = require('../db');

async function removeDuplicates() {
    try {
        console.log('--- Starting Deduplication ---');

        // 1. Find duplicate URLs
        const duplicates = await prisma.property.groupBy({
            by: ['url'],
            _count: { url: true },
            having: {
                url: { _count: { gt: 1 } }
            }
        });

        console.log(`Found ${duplicates.length} URLs with duplicates.`);
        let startCount = await prisma.property.count();
        console.log(`Total properties before: ${startCount}`);

        let deletedCount = 0;

        for (const group of duplicates) {
            const url = group.url;
            // Get all listings for this URL, oldest first
            const listings = await prisma.property.findMany({
                where: { url: url },
                select: { id: true, created_at: true },
                orderBy: { created_at: 'desc' } // Newest first
            });

            // Keep the first one (newest), delete the rest
            const toKeep = listings[0];
            const toDelete = listings.slice(1);

            if (toDelete.length > 0) {
                const idsToDelete = toDelete.map(l => l.id);
                try {
                    await prisma.propertyListing.deleteMany({
                        where: { property_id: { in: idsToDelete } }
                    });

                    // Also delete from saved properties/history etc if cascade not set
                    // But usually cascade takes care, or we just delete property
                    await prisma.property.deleteMany({
                        where: { id: { in: idsToDelete } }
                    });

                    deletedCount += idsToDelete.length;
                    process.stdout.write('.');
                } catch (err) {
                    console.error(`\nFailed to delete duplicates for ${url}:`, err.message);
                }
            }
        }

        console.log(`\n\n--- Deduplication Complete ---`);
        console.log(`Deleted ${deletedCount} duplicate listings.`);

        let endCount = await prisma.property.count();
        console.log(`Total properties after: ${endCount}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

removeDuplicates();
