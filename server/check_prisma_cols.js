const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Environment DATABASE_URL:', process.env.DATABASE_URL);
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clients'
            ORDER BY column_name;
        `;
        console.log('Columns in "clients" table:');
        result.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
