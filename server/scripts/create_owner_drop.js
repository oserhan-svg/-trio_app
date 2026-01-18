const prisma = require('../db');

async function createTestOwnerDrop() {
    try {
        console.log('Creating dummy Owner property with price drop...');

        // 1. Create Property
        const prop = await prisma.property.create({
            data: {
                title: 'TEST OWNER PRICE DROP',
                price: '3000000', // Current Price
                url: 'https://test-owner-drop.com',
                district: 'Küçükköy',
                neighborhood: 'Sarımsaklı Mah.',
                rooms: '2+1',
                size_m2: 100,
                seller_type: 'owner', // CRITICAL
                listing_type: 'sale',
                category: 'daire',
                external_id: 'TEST_OWNER_DROP_001',
                last_scraped: new Date()
            }
        });

        console.log(`Created Property ID: ${prop.id}`);

        // 2. Add History (Higher old price)
        await prisma.propertyHistory.createMany({
            data: [
                {
                    property_id: prop.id,
                    price: '3500000', // Was higher
                    change_type: 'initial',
                    changed_at: new Date(new Date().setDate(new Date().getDate() - 10)) // 10 days ago
                },
                {
                    property_id: prop.id,
                    price: '3000000', // Dropped to current
                    change_type: 'price_decrease',
                    changed_at: new Date(new Date().setDate(new Date().getDate() - 2)) // 2 days ago
                }
            ]
        });

        console.log('History added. This property should now show up in "Price Drop" + "Owner" filter.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createTestOwnerDrop();
