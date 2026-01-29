const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTables() {
    try {
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
        console.log('Tables:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error listing tables:', err);
    } finally {
        await prisma.$disconnect();
    }
}

listTables();
