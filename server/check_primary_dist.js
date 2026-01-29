const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    try {
        console.log('--- CHECKING IS_PRIMARY DISTRIBUTION (FIXED) ---');
        const total = await prisma.property.count({ where: { status: 'active' } });
        const primary = await prisma.property.count({ where: { status: 'active', is_primary: true } });
        const notPrimary = await prisma.property.count({ where: { status: 'active', is_primary: false } });

        console.log('Active Properties:', total);
        console.log('is_primary = true:', primary);
        console.log('is_primary = false:', notPrimary);
        console.log('is_primary = null/unassigned:', total - primary - notPrimary);

        if (primary < total) {
            console.log('\nInsight: Only', primary, 'properties are marked as primary.');
            console.log('The backend currently filters by is_primary: true by default.');
            console.log('This perfectly explains why the user sees only ~33 listings if only that many are marked primary.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
