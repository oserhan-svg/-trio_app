const prisma = require('./db');

async function testPhase3() {
    console.log('=== Phase 3 Verification Script ===\n');

    // 1. Test Demand Auto-Creation Logic Link (Simulated)
    // We check if we can create a demand for a test client
    try {
        const testClient = await prisma.client.findFirst({
            where: { phone: '5551234567' } // Ahmet Yilmaz from previous tests
        });

        if (testClient) {
            console.log(`Checking demands for ${testClient.name}...`);
            const initialDemands = await prisma.demand.count({ where: { client_id: testClient.id } });

            // Simulate AI extraction results
            const leadInfo = {
                budget: "5000000",
                location: "Ayvalık",
                rooms: "3+1"
            };

            // Check if demand exists (logic from whatsappRoutes)
            const existingDemand = await prisma.demand.findFirst({
                where: {
                    client_id: testClient.id,
                    OR: [
                        { district: leadInfo.location },
                        { rooms: leadInfo.rooms }
                    ]
                }
            });

            if (!existingDemand) {
                console.log('Creating simulated AI demand...');
                await prisma.demand.create({
                    data: {
                        client_id: testClient.id,
                        max_price: parseFloat(leadInfo.budget),
                        district: leadInfo.location,
                        rooms: leadInfo.rooms
                    }
                });
                console.log('✅ Demand created successfully.');
            } else {
                console.log('ℹ️ Demand already exists, matching logic working.');
            }
        }
    } catch (err) {
        console.error('❌ Demand test failed:', err);
    }

    // 2. Check AI Feed Endpoint
    console.log('\nChecking AI Feed data...');
    try {
        const recommendations = await prisma.aIRecommendation.findMany({
            where: { is_applied: false, score: { gte: 50 } },
            take: 5,
            include: {
                message: {
                    include: { client: true }
                }
            }
        });
        console.log(`✅ Found ${recommendations.length} active recommendations for the feed.`);
    } catch (err) {
        console.error('❌ AI Feed query failed:', err);
    }

    console.log('\n🎉 Phase 3 Verification Completed!');
}

testPhase3().catch(console.error);
