const prisma = require('../db');

async function testQuery(params, label) {
    console.log(`\n--- Testing: ${label} ---`);
    console.log('Params:', params);

    // Reconstruct the logic briefly to verify correct Prisma query generation if we could import controller...
    // But since we can't easily mock req/res, we rely on checking result counts against known data patterns
    // or just checking if it crashes.

    // Let's create a direct query to database that MATCHES propertyController logic 
    // to verify the logic "concept" is correct, or ideally call an endpoint.
    // Calling endpoint is best if server is running. 
    // Assuming server is running on port 5000:

    try {
        const querystring = new URLSearchParams(params).toString();
        const url = `http://localhost:5000/api/properties?${querystring}`;

        // We need fetch. Node 18+ has native fetch.
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer MOCK_TOKEN_IF_NEEDED' }
            // Wait, auth is required. We need a valid token.
            // This complicates things. Let's just use Prisma directly to test the WHERE clause logic.
        });

        // Back to Prisma direct test of the Logic Part.
        const where = { AND: [] };

        if (params.rooms) {
            const rooms = params.rooms;
            const normalized = rooms.trim().replace(/\s/g, '');
            if (normalized === '4+') {
                where.AND.push({
                    OR: [{ rooms: { startsWith: '4' } }, { rooms: { startsWith: '5' } }, { rooms: { startsWith: '6' } }, { rooms: { startsWith: '7' } }, { rooms: { startsWith: '8' } }, { rooms: { startsWith: '9' } }, { rooms: { startsWith: '10' } }]
                });
            } else {
                where.AND.push({ rooms: { startsWith: normalized } });
            }
        }

        const count = await prisma.property.count({ where });
        console.log(`DB Count (Simulated): ${count}`);

    } catch (e) {
        console.error(e);
    }
}

async function run() {
    try {
        await testQuery({ rooms: '3+1' }, "Rooms: 3+1 (Expect ~460)");
        await testQuery({ rooms: '2+1' }, "Rooms: 2+1 (Expect ~459)");
        await testQuery({ rooms: '5+1' }, "Rooms: 5+1 (Expect ~44)");
        await testQuery({ rooms: '4+' }, "Rooms: 4+ (Expect ~100+)");
    } finally {
        await prisma.$disconnect();
    }
}

run();
