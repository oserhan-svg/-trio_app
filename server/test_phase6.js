const { analyzeClientHealth } = require('./services/pipelineService');
const GroqService = require('./services/GroqService');
const prisma = require('./db');
require('dotenv').config();

async function testPhase6() {
    console.log('--- Phase 6 Verification Started ---');

    try {
        // 1. Test Social Media Content Generation
        console.log('\n[1/3] Testing Social Media Content Generation...');
        const mockProperty = {
            title: 'Ayvalık Sahil Boyu Satılık 3+1 Villa',
            district: 'Ayvalık',
            neighborhood: 'Sarımsaklı',
            price: 7500000,
            rooms: '3+1',
            size_m2: 150
        };
        const socialContent = await GroqService.generateSocialMediaContent(mockProperty);
        if (socialContent) {
            console.log('✅ Social Media Content Generated:');
            console.log('-----------------------------------');
            console.log(socialContent);
            console.log('-----------------------------------\n');
        } else {
            console.log('❌ Social Media Content Generation Failed.');
        }

        // 2. Test Follow-up Draft Generation
        console.log('[2/3] Testing Follow-up Draft Generation...');
        const mockClient = {
            id: 999,
            name: 'Test Müşteri',
            notes: 'Ayvalık merkezde 2+1 bakıyor, bütçe 4M TL.',
            status: 'Active',
            phone: '5551234567'
        };
        const followUpDraft = await GroqService.generateFollowUpDraft(mockClient);
        if (followUpDraft) {
            console.log('✅ Follow-up Draft Generated:');
            console.log('-----------------------------------');
            console.log(followUpDraft);
            console.log('-----------------------------------\n');
        } else {
            console.log('❌ Follow-up Draft Generation Failed.');
        }

        // 3. Test Pipeline Health (Integrated)
        console.log('[3/3] Testing Integrated Pipeline Health Analysis...');
        // Find a real client if possible, or skip
        const realClient = await prisma.client.findFirst({
            include: { whatsapp_messages: true }
        });

        if (realClient) {
            const pipelineService = require('./services/pipelineService');
            // pipelineService is exported as an instance
            const health = await pipelineService.analyzeClientHealth(realClient.id);
            console.log('✅ Pipeline Health Result:', JSON.stringify(health, null, 2));
        } else {
            console.log('ℹ️ No real client found for integrated test, skipping.');
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n--- Phase 6 Verification Completed ---');
    }
}

testPhase6();
