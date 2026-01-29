const prisma = require('./server/db');

async function checkCounts() {
    try {
        console.log('--- Database Diagnostic ---');

        const total = await prisma.property.count();
        console.log('Total Properties:', total);

        const active = await prisma.property.count({ where: { status: 'active' } });
        console.log('Active Properties:', active);

        const primaryActive = await prisma.property.count({ where: { status: 'active', is_primary: true } });
        console.log('Primary & Active Properties:', primaryActive);

        const officeType = await prisma.property.count({ where: { seller_type: 'office' } });
        console.log('Seller Type Office:', officeType);

        const trioEmlakCount = await prisma.property.count({
            where: {
                seller_name: { contains: 'Trio Emlak', mode: 'insensitive' }
            }
        });
        console.log('Seller Name contains "Trio Emlak":', trioEmlakCount);

        const combinations = await prisma.property.count({
            where: {
                status: 'active',
                is_primary: true,
                seller_type: 'office',
                OR: [
                    { seller_name: 'Trio Emlak' },
                    { seller_name: 'Trio Emlak & Gayrimenkul Danışmanlık' },
                    { seller_name: { contains: 'Trio Emlak', mode: 'insensitive' } }
                ]
            }
        });
        console.log('Full Portfolio Filter Match (Active, Primary, Office, Trio Name):', combinations);

        const where = {
            AND: [
                { status: 'active' },
                { is_primary: true },
                { seller_type: 'office' },
                {
                    OR: [
                        { seller_name: 'Trio Emlak' },
                        { seller_name: 'Trio Emlak & Gayrimenkul Danışmanlık' },
                        { seller_name: { contains: 'Trio Emlak', mode: 'insensitive' } }
                    ]
                }
            ]
        };
        const hepsiemlakCount = await prisma.property.count({
            where: {
                ...where,
                OR: [
                    { url: { contains: 'hemlak.com' } },
                    { url: { contains: 'hepsiemlak.com' } }
                ]
            }
        });
        console.log('Hepsiemlak Count (via spread):', hepsiemlakCount);

        const otherCount = await prisma.property.count({
            where: { ...where, url: { contains: 'emlakjet.com' } }
        });
        console.log('Emlakjet Count (via spread):', otherCount);

        // Sample URLs
        const trioUrls = await prisma.property.findMany({
            where,
            take: 5,
            select: { url: true, status: true }
        });
        console.log('Samples of Trio URLs:', JSON.stringify(trioUrls, null, 2));

        const agg = await prisma.property.aggregate({
            where,
            _count: { id: true },
            _sum: { price: true },
            _avg: { price: true }
        });
        console.log('Aggregation Result:', JSON.stringify(agg, null, 2));

        // Check platform counts with spread (matching controller logic)
        const sahibindenCount = await prisma.property.count({
            where: { ...where, url: { contains: 'sahibinden.com' } }
        });
        console.log('Sahibinden Count (via spread):', sahibindenCount);

        // Check user assignments
        const usersWithListings = await prisma.property.groupBy({
            by: ['assigned_user_id'],
            where: { status: 'active', is_primary: true },
            _count: { _all: true }
        });
        console.log('Users with Active/Primary Listings:', JSON.stringify(usersWithListings, null, 2));

        const userNames = await prisma.user.findMany({
            select: { id: true, name: true, role: true }
        });
        console.log('User roles/names:', JSON.stringify(userNames, null, 2));

    } catch (error) {
        console.error('Error during diagnostic:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
