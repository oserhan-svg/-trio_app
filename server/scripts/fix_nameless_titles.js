const prisma = require('../db');

function generatePropertyTitle(prop) {
    const district = prop.district || '';
    const neighborhood = prop.neighborhood || '';
    const rooms = prop.rooms || '';
    const category = prop.category || 'İlan';
    const size = prop.size_m2 ? `${prop.size_m2}m²` : '';

    let titlePrefix = district;
    if (neighborhood && neighborhood !== district) {
        titlePrefix = `${district} ${neighborhood}`;
    }

    const catMap = {
        'daire': 'Daire',
        'villa': 'Villa',
        'mustakil': 'Müstakil Ev',
        'land': 'Arsa',
        'zeytinlik': 'Zeytinlik',
        'tarla': 'Tarla',
        'commercial': 'İşyeri',
        'tourism': 'Turistik Tesis',
        'residential': 'Konut'
    };

    const displayCat = catMap[category.toLowerCase()] || category;

    let generated = `${titlePrefix} ${rooms} ${displayCat}`.trim();
    if (size) generated += ` (${size})`;

    return generated || 'Emlak Portföy İlanı';
}

async function fixTitles() {
    console.log('--- Starting Nameless Title Fix ---');

    const namelessOnes = await prisma.property.findMany({
        where: {
            OR: [
                { title: 'İsimsiz İlan' },
                { title: 'No Title' },
                { title: '' },
                { title: { contains: 'No Title', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Found ${namelessOnes.length} nameless listings.`);

    let fixedCount = 0;
    for (const prop of namelessOnes) {
        const newTitle = generatePropertyTitle(prop);
        console.log(`[ID: ${prop.id}] Fixing: "${prop.title}" -> "${newTitle}"`);

        await prisma.property.update({
            where: { id: prop.id },
            data: { title: newTitle }
        });
        fixedCount++;
    }

    console.log(`Successfully fixed ${fixedCount} listings.`);
}

if (require.main === module) {
    fixTitles()
        .catch(err => console.error('Fix failed:', err))
        .finally(async () => {
            // Prisma disconnect if needed, but db.js usually exports a singleton
        });
}

module.exports = { generatePropertyTitle };
