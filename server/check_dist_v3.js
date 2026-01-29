const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    try {
        console.log('--- CHECKING LISTING_TYPE & CATEGORY DISTRIBUTION ---');

        // Exact replicate of controller's default where
        const where = { AND: [] };
        where.AND.push({ status: 'active' });
        where.AND.push({ is_primary: true });

        const totalDefault = await prisma.property.count({ where });
        console.log('Results with DEFAULT filters (Status:active, Primary:true):', totalDefault);

        // Breaking it down
        const saleCount = await prisma.property.count({ where: { ...where, listing_type: 'sale' } });
        const rentCount = await prisma.property.count({ where: { ...where, listing_type: 'rent' } });

        console.log('Listing Type - Sale:', saleCount);
        console.log('Listing Type - Rent:', rentCount);

        const categories = await prisma.property.groupBy({
            by: ['category'],
            where,
            _count: { _all: true }
        });

        console.log('Category Distribution:');
        categories.forEach(c => console.log(`- ${c.category}: ${c._count._all}`));

        // Check if there are any other hardcoded filters in DB?
        // Like district?
        const districts = await prisma.property.groupBy({
            by: ['district'],
            where,
            _count: { _all: true }
        });
        console.log('District Distribution:');
        districts.forEach(d => console.log(`- ${d.district}: ${d._count._all}`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
