const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing DB Access...');
        const userCount = await prisma.user.count();
        console.log(`✅ DB Connection Success. User count: ${userCount}`);
    } catch (e) {
        console.error('❌ DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
