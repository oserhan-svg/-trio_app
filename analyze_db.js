const prisma = require('./server/db');

async function analyze() {
    try {
        console.log('--- Portfolio Data Analysis ---');

        const total = await prisma.property.count();
        console.log('Total Properties:', total);

        // Distribution by Status
        const statuses = await prisma.property.groupBy({
            by: ['status'],
            _count: { _all: true }
        });
        console.log('Status Distribution:', JSON.stringify(statuses, null, 2));

        // Office Listings
        const officeListings = await prisma.property.count({
            where: {
                OR: [
                    { seller_type: 'office' },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { assigned_user_id: { not: null } }
                ]
            }
        });
        console.log('Total Trio/Office Listings (Any Status):', officeListings);

        // Office & Active
        const officeActive = await prisma.property.count({
            where: {
                status: 'active',
                OR: [
                    { seller_type: 'office' },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { assigned_user_id: { not: null } }
                ]
            }
        });
        console.log('Total Trio/Office Listings (Active):', officeActive);

        // Office & Active & Primary
        const officeActivePrimary = await prisma.property.count({
            where: {
                status: 'active',
                is_primary: true,
                OR: [
                    { seller_type: 'office' },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } },
                    { assigned_user_id: { not: null } }
                ]
            }
        });
        console.log('Total Trio/Office Listings (Active & Primary):', officeActivePrimary);

        // Sample of Active Office listings that are NOT primary
        const samplesNotPrimary = await prisma.property.findMany({
            where: {
                status: 'active',
                is_primary: false,
                OR: [
                    { seller_type: 'office' },
                    { seller_name: { contains: 'Trio', mode: 'insensitive' } }
                ]
            },
            take: 3,
            select: { id: true, title: true, is_primary: true, group_id: true }
        });
        console.log('Sample Active/Office (Not Primary):', JSON.stringify(samplesNotPrimary, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyze();
