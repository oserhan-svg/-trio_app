const prisma = require('../db');

async function checkSchema() {
    try {
        // Query PostgreSQL information schema to get actual table names
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        console.log('📋 Database Tables:');
        console.log(tables);

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
    }
}

checkSchema();
