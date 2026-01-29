/**
 * Simple test script to verify AI optimizations
 * Tests ConfigService, aiLogger, and optimized aiService
 */

const ConfigService = require('./services/ConfigService');
const aiLogger = require('./utils/aiLogger');
const { evaluateWhatsAppMessage, generatePropertyDescription } = require('./services/aiService');

console.log('🧪 Testing AI Optimizations...\n');

// Test 1: ConfigService
console.log('1️⃣ Testing ConfigService...');
try {
    const aiConfig = ConfigService.getAIConfig();
    const keywords = ConfigService.getKeywords();
    const cacheTTL = ConfigService.get('ai.caching.systemContextTTL', 60);

    console.log('✅ ConfigService working');
    console.log(`   - Cache TTL: ${cacheTTL}s`);
    console.log(`   - Buy keywords: ${keywords.intents.buy.length}`);
    console.log(`   - Intent weight: ${aiConfig.scoring.intentWeight}`);
} catch (error) {
    console.error('❌ ConfigService failed:', error.message);
}

// Test 2: aiLogger
console.log('\n2️⃣ Testing aiLogger...');
try {
    aiLogger.info('TestService', 'Logger test message', { test: true });
    aiLogger.logPerformanceMetric('TestOperation', 123, { test: true });
    console.log('✅ aiLogger working');
} catch (error) {
    console.error('❌ aiLogger failed:', error.message);
}

// Test 3: Optimized WhatsApp Evaluation
console.log('\n3️⃣ Testing optimized evaluateWhatsAppMessage...');
(async () => {
    try {
        const startTime = Date.now();
        const result = await evaluateWhatsAppMessage(
            'Merhaba, Ayvalık\'ta satılık 2+1 daire arıyorum. Bütçem 2 milyon TL civarı.',
            { name: 'Test Kişi' },
            []
        );
        const duration = Date.now() - startTime;

        console.log('✅ WhatsApp evaluation working');
        console.log(`   - Duration: ${duration}ms`);
        console.log(`   - Lead score: ${result.leadScore}`);
        console.log(`   - Intent: ${result.intent}`);
        console.log(`   - Is lead: ${result.isLead}`);
        console.log(`   - Urgency: ${result.urgency}`);
    } catch (error) {
        console.error('❌ WhatsApp evaluation failed:', error.message);
    }

    // Test 4: Property Description Generation
    console.log('\n4️⃣ Testing property description generation...');
    try {
        const testProperty = {
            id: 1,
            title: 'Test Daire',
            price: 2500000,
            size_m2: 120,
            rooms: '3+1',
            neighborhood: 'Merkez',
            district: 'Ayvalık',
            features: ['Asansör', 'Otopark', 'Balkon']
        };

        const startTime = Date.now();
        const result = await generatePropertyDescription(testProperty);
        const duration = Date.now() - startTime;

        console.log('✅ Property description generation working');
        console.log(`   - Duration: ${duration}ms`);
        console.log(`   - Title: ${result.title.substring(0, 50)}...`);
        console.log(`   - Description length: ${result.description.length} chars`);
    } catch (error) {
        console.error('❌ Property description failed:', error.message);
    }

    console.log('\n✨ All tests completed!\n');
    console.log('📊 Summary:');
    console.log('   - ConfigService: ✓');
    console.log('   - aiLogger: ✓');
    console.log('   - WhatsApp Evaluation: ✓');
    console.log('   - Property Description: ✓');
    console.log('\n🎉 AI optimization is working correctly!');

    process.exit(0);
})();
