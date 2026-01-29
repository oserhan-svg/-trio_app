const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('1. Testing simple count...');
        const count = await prisma.client.count();
        console.log('Count:', count);

        console.log('2. Testing findFirst...');
        const first = await prisma.client.findFirst();
        console.log('First client (id):', first?.id);
        console.log('First client profile_pic_url:', first?.profile_pic_url);

        console.log('3. Testing findMany with include...');
        const many = await prisma.client.findMany({
            take: 1,
            include: { demands: true }
        });
        console.log('FindMany success');

    } catch (e) {
        console.error('Test failed with error:');
        console.error(e);
        if (e.meta) console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

test();
