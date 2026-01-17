const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Mock Properties
    const properties = [
        {
            title: 'Ayvalık Merkezde Satılık 3+1 Daire',
            price: 3500000,
            size_m2: 120,
            rooms: '3+1',
            district: 'Ayvalık',
            neighborhood: '150 Evler',
            url: 'https://example.com/p1',
            external_id: 'MOCK_001',
            last_scraped: new Date()
        },
        {
            title: 'Deniz Manzaralı Lüks Daire',
            price: 5250000,
            size_m2: 145,
            rooms: '4+1',
            district: 'Ayvalık',
            neighborhood: 'Ali Çetinkaya',
            url: 'https://example.com/p2',
            external_id: 'MOCK_002',
            last_scraped: new Date()
        },
        {
            title: 'Yatırımlık 1+1 Fırsat',
            price: 1850000,
            size_m2: 65,
            rooms: '1+1',
            district: 'Ayvalık',
            neighborhood: '150 Evler',
            url: 'https://example.com/p3',
            external_id: 'MOCK_003',
            last_scraped: new Date()
        }
    ];

    for (const p of properties) {
        const prop = await prisma.property.upsert({
            where: { external_id: p.external_id },
            update: {},
            create: p,
        });

        // History
        await prisma.propertyHistory.create({
            data: {
                property_id: prop.id,
                price: p.price,
                change_type: 'initial'
            }
        });
    }
    console.log('✅ Added 3 Mock Properties');

    // 2. Create Mock Clients
    const client = await prisma.client.create({
        data: {
            name: 'Örnek Müşteri Ahmet Bey',
            phone: '0555 123 45 67',
            email: 'ahmet@example.com',
            notes: 'Yazlık arıyor, deniz manzarası önemli.',
            demands: {
                create: {
                    min_price: 3000000,
                    max_price: 6000000,
                    rooms: '3+1',
                    district: 'Ayvalık'
                }
            }
        }
    });
    console.log('✅ Added Mock Client');

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
