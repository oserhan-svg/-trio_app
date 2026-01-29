const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Prisma Client Models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));

        console.log('\nDatabase Tables:');
        const tables = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(tables);

        // Try to count clients if possible
        if (prisma.client) {
            const count = await prisma.client.count();
            console.log('\nClient Count:', count);
        } else {
            console.log('\nprisma.client is NOT defined');
        }

    } catch (e) {
        console.error('Diagnostic failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
