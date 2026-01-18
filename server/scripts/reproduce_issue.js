const prisma = require('../db');

async function testQuery(params, label) {
    console.log(`\n--- Testing: ${label} ---`);
    console.log('Params:', params);

    const { category } = params;
    const where = { AND: [] };

    // Simulate the Controller Logic EXACTLY as it is now
    if (category && category !== 'all') {
        if (category === 'daire') {
            where.AND.push({
                category: { in: ['daire', 'residential'] }
            });
        } else {
            where.AND.push({ category: category });
        }
    }

    // console.log('Where:', JSON.stringify(where));

    const count = await prisma.property.count({ where });
    console.log(`Result Count: ${count}`);
}

async function run() {
    try {
        // 1. What if frontend sends "Daire" (Capitalized)?
        await testQuery({ category: 'Daire' }, "Category: 'Daire' (Capitalized)");

        // 2. What if frontend sends "daire" (Lowercase) - This is what I fixed
        await testQuery({ category: 'daire' }, "Category: 'daire' (Lowercase)");

        // 3. What if frontend sends "residential"?
        await testQuery({ category: 'residential' }, "Category: 'residential'");

    } finally {
        await prisma.$disconnect();
    }
}

run();
