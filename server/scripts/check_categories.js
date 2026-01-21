const prisma = require('../db');

async function checkCategories() {
    try {
        const categories = await prisma.property.groupBy({
            by: ['category'],
            _count: { id: true }
        });
        console.table(categories);

        // Also sample some titles for context
        const samples = await prisma.property.findMany({
            take: 10,
            select: { title: true, category: true }
        });
        console.log('Sample Titles:', samples);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
