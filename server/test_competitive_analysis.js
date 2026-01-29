const proactiveAIService = require('./services/proactiveAIService');
const prisma = require('./db');

async function testCompetitiveAnalysis() {
    console.log('🧪 Testing Competitive Analysis...');

    try {
        // 1. Create a dummy client and demand
        const dummyClient = await prisma.client.create({
            data: {
                name: 'Test Investor',
                phone: '905550000000',
                ai_delegated: true,
                priority_score: 80
            }
        });

        await prisma.demand.create({
            data: {
                client_id: dummyClient.id,
                district: 'Cunda',
                max_price: 15000000
            }
        });

        // 2. Create a dummy interaction/property that is "Cheaper"
        const testProp = await prisma.property.create({
            data: {
                title: 'Fırsat Cunda Taş Evi',
                price: 12000000,
                district: 'Cunda',
                url: 'http://test.com/prop1'
            }
        });

        await prisma.interaction.create({
            data: {
                client_id: dummyClient.id,
                property_id: testProp.id,
                type: 'property_interest',
                notes: 'Interested in price'
            }
        });

        // 3. Run Analysis
        await proactiveAIService.runCompetitiveAnalysis(dummyClient);

        // 4. Cleanup
        console.log('🧹 Cleaning up...');
        await prisma.interaction.deleteMany({ where: { client_id: dummyClient.id } });
        await prisma.demand.deleteMany({ where: { client_id: dummyClient.id } });
        await prisma.property.delete({ where: { id: testProp.id } });
        await prisma.client.delete({ where: { id: dummyClient.id } });

        console.log('✅ Test Completed.');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testCompetitiveAnalysis();
