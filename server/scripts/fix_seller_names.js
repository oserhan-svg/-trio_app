const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSellerNames() {
    console.log('Starting seller name cleanup...');
    const props = await prisma.property.findMany({
        where: {
            OR: [
                { seller_name: { contains: '#' } },
                { seller_name: { contains: 'Satılık' } },
                { seller_name: { contains: 'Kiralık' } }
            ]
        }
    });

    console.log(`Found ${props.length} potential candidates.`);

    let count = 0;
    for (const p of props) {
        // If seller_name is very long (title-like) AND contains ID or looks like a title
        // Heuristic: If seller_name is > 20 chars AND (contains '#' OR equals Title)
        if (p.seller_name.length > 20 && (p.seller_name.includes('#') || p.seller_name === p.title)) {
            let newName = 'Bilinmiyor';
            let newType = p.seller_type;

            if (p.seller_name.toLowerCase().startsWith('sahibinden') ||
                p.seller_name.toLowerCase().includes('sahibinden satılık')) {
                newName = 'Sahibinden';
                newType = 'owner';
            } else if (p.seller_name.toLowerCase().includes('banka')) {
                newName = 'Banka';
                newType = 'bank';
            }

            console.log(`Fixing ID ${p.id}: ${p.seller_name.substring(0, 30)}... -> ${newName}`);

            await prisma.property.update({
                where: { id: p.id },
                data: { seller_name: newName, seller_type: newType }
            });
            count++;
        }
    }
    console.log(`Successfully fixed ${count} properties.`);
}

fixSellerNames()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
