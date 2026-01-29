const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ayvalikMockData = [
    {
        external_id: 'AYV_101',
        title: 'Cunda Adası Manzaralı Taş Ev',
        price: 8500000,
        size_m2: 180,
        rooms: '4+1',
        district: 'Ayvalık',
        neighborhood: 'Mithatpaşa Mah.',
        url: 'https://hepsiemlak.com/mimari-harika-tas-ev',
        seller_type: 'owner',
        category: 'villa',
        is_primary: true
    },
    {
        external_id: 'AYV_102',
        title: 'Sarımsaklı Plajına Sıfır Yazlık',
        price: 4500000,
        size_m2: 110,
        rooms: '2+1',
        district: 'Ayvalık',
        neighborhood: 'Küçükköy Mah.',
        url: 'https://sahibinden.com/sahilden-satilik-yazlik',
        seller_type: 'office',
        category: 'daire',
        is_primary: true
    },
    {
        external_id: 'AYV_103',
        title: 'Ayvalık Merkezde Tarihi Rum Evi',
        price: 12000000,
        size_m2: 220,
        rooms: '5+2',
        district: 'Ayvalık',
        neighborhood: 'Hayrettinpaşa Mah.',
        url: 'https://emlakjet.com/tarihi-rum-evi-merkezde',
        seller_type: 'owner',
        category: 'mustakil',
        is_primary: true
    },
    {
        external_id: 'AYV_104',
        title: '150 Evler Mahallesinde Geniş 3+1',
        price: 3200000,
        size_m2: 135,
        rooms: '3+1',
        district: 'Ayvalık',
        neighborhood: '150 Evler Mah.',
        url: 'https://hepsiemlak.com/150-evler-genis-daire',
        seller_type: 'office',
        category: 'daire',
        is_primary: true
    },
    {
        external_id: 'AYV_105',
        title: 'Armutçuk Mevkiinde Deniz Manzaralı Daire',
        price: 5200000,
        size_m2: 125,
        rooms: '3+1',
        district: 'Ayvalık',
        neighborhood: 'Ali Çetinkaya Mah.',
        url: 'https://sahibinden.com/armutcuk-deniz-manzara',
        seller_type: 'owner',
        category: 'daire',
        is_primary: true
    }
];

async function main() {
    console.log('--- SEEDING COMPREHENSIVE AYVALIK DATA ---');
    try {
        for (const data of ayvalikMockData) {
            const prop = await prisma.property.upsert({
                where: { external_id: data.external_id },
                update: data,
                create: data
            });

            // Initial history
            await prisma.propertyHistory.upsert({
                where: { id: prop.id }, // Note: This is an abuse of history schema if it uses autoincrement ID, but works for mock if ID is stable
                update: {},
                create: {
                    property_id: prop.id,
                    price: data.price,
                    change_type: 'initial'
                }
            }).catch(() => {
                // Ignore history upsert errors if ID logic is different, just create if needed
                return prisma.propertyHistory.create({
                    data: {
                        property_id: prop.id,
                        price: data.price,
                        change_type: 'initial'
                    }
                });
            });

            console.log(`✅ Seeded: ${data.title}`);
        }
        console.log('--- SEEDING COMPLETE ---');
    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
