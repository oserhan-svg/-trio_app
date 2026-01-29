const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCounts() {
    try {
        console.log('--- Property Count Analysis ---');

        // 1. Total Raw Count
        const totalRaw = await prisma.property.count();
        console.log(`Total listings in DB (Raw): ${totalRaw}`);

        // 2. Breakdown by Status
        const statusCounts = await prisma.property.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        console.log('\nBreakdown by Status:');
        statusCounts.forEach(s => {
            console.log(`- ${s.status}: ${s._count.id}`);
        });

        // 3. Active Listings (What is usually shown)
        const activeCount = await prisma.property.count({ where: { status: 'active' } });
        console.log(`\nActive Listings: ${activeCount}`);

        // 4. Removed Listings
        const removedCount = await prisma.property.count({ where: { status: 'removed' } });
        console.log(`Removed Listings: ${removedCount}`);

        // 5. Duplicates? (Same URL)
        // Group by URL and count
        const urlGroups = await prisma.property.groupBy({
            by: ['url'],
            _count: { id: true },
            having: {
                id: {
                    _count: { gt: 1 }
                }
            }
        });
        console.log(`\nDuplicate URLs found: ${urlGroups.length}`);
        const duplicateCount = urlGroups.reduce((acc, curr) => acc + (curr._count.id - 1), 0);
        console.log(`Total properties that are duplicates: ${duplicateCount}`);

        // 6. Listings without external_id (might be ghosts)
        const noExtId = await prisma.property.count({ where: { external_id: null } });
        console.log(`\nListings without external_id: ${noExtId}`);

        // 7. Group ID analysis
        const groupCounts = await prisma.property.groupBy({
            by: ['group_id'],
            _count: { id: true }
        });
        const groupedListings = groupCounts.filter(g => g.group_id !== null).reduce((acc, curr) => acc + curr._count.id, 0);
        const uniqueGroups = groupCounts.filter(g => g.group_id !== null).length;
        console.log(`\nListings in groups: ${groupedListings} (across ${uniqueGroups} groups)`);

    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeCounts();
