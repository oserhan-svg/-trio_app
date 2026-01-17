const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing create...');
        const newProp = await prisma.property.create({
            data: {
                external_id: 'DEBUG_' + Date.now(),
                title: 'Debug Test',
                price: 1500000.50,
                size_m2: 120.5,
                url: 'https://example.com/test',
                district: 'Ayvalık',
                neighborhood: 'Merkez',
                rooms: '3+1'
            }
        });
        console.log('CREATED SUCCESS:', newProp.id);

        console.log('Testing history create...');
        await prisma.propertyHistory.create({
            data: {
                property_id: newProp.id,
                price: 1500000.50,
                change_type: 'initial'
            }
        });
        console.log('HISTORY CREATED SUCCESS');

    } catch (e) {
        console.error('--- PRISMA ERROR ---');
        console.error('Message:', e.message);
        console.error('Code:', e.code);
        console.error('Stack:', e.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
