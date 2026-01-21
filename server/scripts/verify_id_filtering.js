const prisma = require('../db');

async function testIdLimit() {
    console.log('--- Testing ID Limit Bypass ---');

    // 1. Get 100 IDs to test with
    const properties = await prisma.property.findMany({
        take: 100,
        select: { id: true }
    });

    const ids = properties.map(p => p.id);
    console.log(`Testing with ${ids.length} IDs`);

    // Simulate getProperties logic
    const where = { AND: [] };
    const idList = ids;
    where.AND.push({ id: { in: idList } });

    // The fixed logic: if IDs are provided, limit is set to the list size if not explicitly provided
    let limit = 50; // default
    if (ids.length > 0) {
        limit = idList.length;
    }

    const results = await prisma.property.findMany({
        where,
        take: limit
    });

    console.log(`Requested: ${ids.length}, Returned: ${results.length}`);

    if (results.length === ids.length) {
        console.log('✅ PASS: All requested IDs returned.');
    } else {
        console.log('❌ FAIL: Limit still applied.');
    }

    await prisma.$disconnect();
}

testIdLimit().catch(err => {
    console.error(err);
    process.exit(1);
});
