
const prisma = require('../db');

async function verifyStats() {
    try {
        console.log('--- Verifying Database Stats ---');

        // Total Properties
        const total = await prisma.property.count();
        console.log('Total Properties:', total);

        // Breakdown by Type (Satılık/Kiralık)
        const saleCount = await prisma.property.count({ where: { listing_type: 'sale' } });
        const rentCount = await prisma.property.count({ where: { listing_type: 'rent' } });
        console.log('Satılık:', saleCount);
        console.log('Kiralık:', rentCount);

        // Breakdown by Provider (Source)
        const sahibindenCount = await prisma.property.count({ where: { url: { contains: 'sahibinden' } } });
        const hepsiemlakCount = await prisma.property.count({ where: { url: { contains: 'hepsiemlak' } } });
        const emlakjetCount = await prisma.property.count({ where: { url: { contains: 'emlakjet' } } });
        console.log('Sahibinden:', sahibindenCount);
        console.log('Hepsiemlak:', hepsiemlakCount);
        console.log('Emlakjet:', emlakjetCount);

        // Breakdown by Category
        const apartmentCount = await prisma.property.count({ where: { category: 'residential' } });
        const villaCount = await prisma.property.count({ where: { category: 'villa' } });
        const landCount = await prisma.property.count({ where: { category: 'land' } });
        const workplaceCount = await prisma.property.count({ where: { category: 'workplace' } }); // commercial/tourism

        console.log('--- Granular Breakdown ---');
        console.log('Residential (Daire):', apartmentCount);
        console.log('Villa (Müstakil/Villa):', villaCount);
        console.log('Land (Arsa/Tarla):', landCount);
        console.log('Workplace/Other:', workplaceCount);

        // Specific Target Analysis (Satılık Daire)
        const saleApartmentCount = await prisma.property.count({
            where: {
                listing_type: 'sale',
                category: 'residential'
            }
        });
        console.log('>>> SATILIK DAIRE (Residential Sale):', saleApartmentCount);

        const saleVillaCount = await prisma.property.count({
            where: {
                listing_type: 'sale',
                category: 'villa'
            }
        });
        console.log('>>> SATILIK VILLA:', saleVillaCount);

        // Check for duplicates (URL based) using Prisma groupBy
        const duplicates = await prisma.property.groupBy({
            by: ['url'],
            _count: {
                url: true
            },
            having: {
                url: {
                    _count: {
                        gt: 1
                    }
                }
            }
        });
        console.log('Duplicate URLs found:', duplicates.length);
        if (duplicates.length > 0) {
            console.log('First 5 Duplicates:', duplicates.slice(0, 5));
        }

    } catch (e) {
        console.error('Verification Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyStats();
