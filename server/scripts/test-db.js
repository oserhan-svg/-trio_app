const prisma = require('./db');

async function main() {
    console.log('Testing Prisma Connection...');

    try {
        // 1. Create a test property
        const testProp = await prisma.property.create({
            data: {
                external_id: 'TEST_99999',
                title: 'Prisma Test Property',
                price: 1500000,
                url: 'http://test.com',
                district: 'TestDistrict',
                neighborhood: '150 Evler',
                rooms: '3+1'
            }
        });
        console.log('✅ Created Test Property:', testProp.id);

        // 2. Read it back
        const readProp = await prisma.property.findUnique({
            where: { external_id: 'TEST_99999' }
        });
        console.log('✅ Read Test Property:', readProp.title);

        // 3. Delete it
        await prisma.property.delete({
            where: { id: readProp.id }
        });
        console.log('✅ Deleted Test Property');

        console.log('🎉 Database verification successful!');
    } catch (e) {
        console.error('❌ Verification failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
