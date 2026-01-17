const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeNeighborhood = (name) => {
    if (!name) return '';
    let clean = name.trim();
    // Remove "Mahallesi", "Mah", "Mah.", "Mh.", "Mh" case insensitive
    clean = clean.replace(/\s+Mahallesi/i, '')
        .replace(/\s+Mah\.?/i, '')
        .replace(/\s+Mh\.?/i, '')
        .trim();

    // Always add " Mah." suffix
    return clean + ' Mah.';
};

async function fixNeighborhoods() {
    console.log('Fixing neighborhood formats in DB...');
    const properties = await prisma.property.findMany();

    console.log(`Processing ${properties.length} properties...`);

    let updatedCount = 0;
    for (const prop of properties) {
        const standardName = normalizeNeighborhood(prop.neighborhood);

        if (prop.neighborhood !== standardName) {
            await prisma.property.update({
                where: { id: prop.id },
                data: { neighborhood: standardName }
            });
            updatedCount++;
        }
    }

    console.log(`Done. Updated ${updatedCount} properties.`);
    process.exit(0);
}

fixNeighborhoods().catch(err => {
    console.error(err);
    process.exit(1);
});
