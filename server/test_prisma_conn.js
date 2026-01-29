const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function checkPrisma() {
    console.log('ENV DATABASE_URL:', process.env.DATABASE_URL.split('@')[1]);
    try {
        const result = await prisma.$queryRaw`SELECT current_database(), current_schema();`;
        console.log('Prisma is connected to:', result);

        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
        console.log('Tables in public schema:', tables.map(t => t.table_name));

        const clientCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'clients';`;
        console.log('Columns in clients table:', clientCols.map(c => c.column_name));

        const demandCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'demands';`;
        console.log('Columns in demands table:', demandCols.map(c => c.column_name));

    } catch (err) {
        console.error('Prisma query failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkPrisma();
