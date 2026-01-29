const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSchema() {
    try {
        console.log('--- Starting Manual Schema Update ---');

        console.log('Updating Property table...');
        await prisma.$executeRaw`ALTER TABLE "properties" ALTER COLUMN "price" TYPE DECIMAL(15, 2);`;

        console.log('Updating PropertyHistory table...');
        await prisma.$executeRaw`ALTER TABLE "property_history" ALTER COLUMN "price" TYPE DECIMAL(15, 2);`;

        console.log('Updating Demand table...');
        await prisma.$executeRaw`ALTER TABLE "demands" ALTER COLUMN "min_price" TYPE DECIMAL(15, 2);`;
        await prisma.$executeRaw`ALTER TABLE "demands" ALTER COLUMN "max_price" TYPE DECIMAL(15, 2);`;

        console.log('Updating Deals table...');
        await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "sale_price" TYPE DECIMAL(15, 2);`;
        await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "commission_amount" TYPE DECIMAL(15, 2);`;
        await prisma.$executeRaw`ALTER TABLE "deals" ALTER COLUMN "consultant_share" TYPE DECIMAL(15, 2);`;

        console.log('Updating AIImpactMetric table...');
        await prisma.$executeRaw`ALTER TABLE "ai_impact_metrics" ALTER COLUMN "conversion_value" TYPE DECIMAL(15, 2);`;

        console.log('✅ Schema update completed successfully.');

        // Verification
        const result = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name IN ('properties', 'property_history', 'demands', 'deals', 'ai_impact_metrics') 
      AND (column_name LIKE '%price%' OR column_name = 'conversion_value' OR column_name = 'commission_amount' OR column_name = 'consultant_share');
    `;
        console.log('Verification Info:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('❌ Error during schema update:', err);
    } finally {
        await prisma.$disconnect();
    }
}

updateSchema();
