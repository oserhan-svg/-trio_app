require('dotenv').config();
const GroqService = require('./services/GroqService');

async function test() {
    console.log('Testing Groq Chat...');
    try {
        console.log('--- Test 1: Simple Message ---');
        const result1 = await GroqService.chat('Merhaba');
        console.log('Result 1:', JSON.stringify(result1, null, 2));

        console.log('\n--- Test 2: Web Search ---');
        const result2 = await GroqService.chat('23 Ocak 2026 dolar kuru ne kadar?');
        console.log('Result 2:', JSON.stringify(result2, null, 2));
    } catch (err) {
        console.error('Fatal Test Error:', err);
    }
}

test();
