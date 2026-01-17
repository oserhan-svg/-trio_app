const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Database...');

    // Check available models on the instance
    console.log('Available Prisma Models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

    // Check Counts
    try {
        const propCount = await prisma.property.count();
        console.log(`🏠 Properties Count: ${propCount}`);
    } catch (e) { console.log('❌ Error counting properties:', e.message); }

    try {
        const clientCount = await prisma.client.count();
        console.log(`👥 Clients Count: ${clientCount}`);
    } catch (e) { console.log('❌ Error counting clients:', e.message); }

    // Re-Seed if empty
    if (propCount === 0) {
        console.log('⚠️ Database is empty. Running seed...');
        // Call seed function logic here or just exit
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
