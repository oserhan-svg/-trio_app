const prisma = require('./db');
const pipelineService = require('./services/pipelineService');
const matchingService = require('./services/matchingService');

async function testPhase4() {
    console.log('=== Phase 4 Verification Script ===\n');

    const testClientId = 131; // Using a client with demands from DB

    // 1. Test Pipeline Automation
    console.log('Testing Pipeline Automation...');
    try {
        const client = await prisma.client.findUnique({ where: { id: testClientId } });
        if (client) {
            console.log(`Current status: ${client.status}`);

            // Mock serious/negotiation lead info
            const leadInfo = {
                seriousnessScore: 95,
                summary: "Müşteri teklif vermek istiyor ve pazarlık için randevu talep etti."
            };

            const transitioned = await pipelineService.autoTransitionClient(client, leadInfo);
            if (transitioned) {
                console.log(`✅ Auto-transitioned to: ${transitioned}`);
            } else {
                console.log('ℹ️ No transition needed or logic check failed.');
            }
        }
    } catch (err) {
        console.error('❌ Pipeline test failed:', err);
    }

    // 2. Test Property Matching and Drafting
    console.log('\nTesting Smart Matching Draft...');
    try {
        const matches = await matchingService.findMatchesForClient(testClientId);
        console.log(`Found ${matches.length} matches.`);

        if (matches.length > 0) {
            const topMatches = matches.slice(0, 3);
            // We won't call Groq here to save tokens/time, just check logic connectivity
            console.log('✅ Matching service returned properties.');
            console.log(`Top match: ${topMatches[0].title} (${topMatches[0].match_quality}%)`);
        }
    } catch (err) {
        console.error('❌ Matching test failed:', err);
    }

    console.log('\n🎉 Phase 4 Verification Completed!');
}

testPhase4().catch(console.error);
