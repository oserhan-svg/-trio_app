
const prisma = require('../db');

async function normalizeCategories() {
    try {
        console.log('--- Normalizing Categories ---');

        // 1. Daire -> residential
        const resUpdate = await prisma.property.updateMany({
            where: { category: 'daire' },
            data: { category: 'residential' }
        });
        console.log(`Normalized 'daire' to 'residential': ${resUpdate.count}`);

        // 2. Mustakil -> villa
        const villaUpdate = await prisma.property.updateMany({
            where: { category: 'mustakil' },
            data: { category: 'villa' }
        });
        console.log(`Normalized 'mustakil' to 'villa': ${villaUpdate.count}`);

        // 3. Tarla/Zeytinlik -> land
        const landUpdate = await prisma.property.updateMany({
            where: { category: { in: ['tarla', 'zeytinlik'] } },
            data: { category: 'land' }
        });
        console.log(`Normalized 'tarla/zeytinlik' to 'land': ${landUpdate.count}`);

        console.log('--- Final Check ---');
        const groups = await prisma.property.groupBy({ by: ['category'], _count: { id: true } });
        console.log(groups);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

normalizeCategories();
