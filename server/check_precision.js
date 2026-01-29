const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        const result = await prisma.$queryRaw`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'properties' AND column_name = 'price';
    `;
        console.log('Column Info:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
