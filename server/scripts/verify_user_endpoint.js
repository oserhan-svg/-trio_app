const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGetUsers() {
    console.log('🧪 Testing getUsers logic...');
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                created_at: true
            },
            orderBy: { created_at: 'desc' }
        });
        console.log('✅ Success! Found users:', users.length);
        console.table(users);

        // Check for any potential serialization issues (e.g. BigInt)
        JSON.stringify(users);
        console.log('✅ JSON Serialization check passed.');

    } catch (e) {
        console.error('❌ FAIL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testGetUsers();
