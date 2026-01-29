const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Repairing Portfolio Data based on known Trio matches...');

        // 1. Find Seed Listings (Explicit Trio Matches)
        const seedListings = await prisma.property.findMany({
            where: {
                OR: [
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { url: { contains: 'trio', mode: 'insensitive' } }
                ]
            },
            select: { id: true, group_id: true }
        });

        console.log(`Found ${seedListings.length} seed listings (Trio matches).`);

        const groupIds = seedListings
            .map(s => s.group_id)
            .filter(g => g !== null);

        const uniqueGroups = [...new Set(groupIds)];
        console.log(`Associated unique groups: ${uniqueGroups.length}`);

        if (uniqueGroups.length === 0) {
            console.log('No groups found. Cannot expand selection.');
            return;
        }

        // 2. Find ALL listings in these groups (The "Extended Portfolio")
        const fullPortfolio = await prisma.property.findMany({
            where: {
                group_id: { in: uniqueGroups }
            }
        });

        console.log(`Found total ${fullPortfolio.length} listings in portfolio groups.`);

        // 3. Update them to be proper "Office Portfolio"
        // Set seller_name='Trio Emlak' and assigned_user_id=1 (Admin)
        // Also ensure seller_type='office'
        const updateResult = await prisma.property.updateMany({
            where: {
                id: { in: fullPortfolio.map(p => p.id) }
            },
            data: {
                seller_name: 'Trio Emlak',
                seller_type: 'office',
                assigned_user_id: 1, // Assign to Admin
                is_primary: true
            }
        });

        console.log(`✅ Updated ${updateResult.count} listings to be 'Trio Emlak' & Assigned.`);

        // 4. Verify Counts
        const counts = await prisma.property.groupBy({
            by: ['url'],
            where: { seller_name: 'Trio Emlak' },
            _count: { id: true }
        });

        let sCount = 0;
        let hCount = 0;

        const allUpdated = await prisma.property.findMany({ where: { seller_name: 'Trio Emlak' } });

        allUpdated.forEach(p => {
            if (p.url.includes('sahibinden')) sCount++;
            if (p.url.includes('hepsiemlak') || p.url.includes('hemlak')) hCount++;
        });

        console.log('--- NEW PORTFOLIO STATUS ---');
        console.log(`Sahibinden: ${sCount}`);
        console.log(`Hepsiemlak: ${hCount}`);

    } catch (err) {
        console.error('Portfolio Repair Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
