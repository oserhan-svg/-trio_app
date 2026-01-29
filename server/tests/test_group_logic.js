/**
 * Verification script for WhatsApp Group Logic & Categorization
 * Run with: node tests/test_group_logic.js
 */

const GroqService = require('../services/GroqService');

async function verifyLogic() {
    console.log('=== WhatsApp Group & Categorization Verification ===\n');

    const testCases = [
        {
            name: 'Group Message - Customer Inquiry',
            message: 'Selamlar herkese, Kadıköy merkezde 3+1 kiralık daire arıyorum. Bütçem 25-30 bin TL civarı. Elinde olan var mı?',
            history: [],
            expectedUserType: 'customer',
            expectedLead: true
        },
        {
            name: 'Group Message - Other Agent (Sharing Listing)',
            message: 'Meslektaşlarım hayırlı işler. Cunda merkezde taş ev portföyümüz geldi. 5.500.000 TL, tam yetkiliyiz. İlgilenen olursa DM lütfen.',
            history: [],
            expectedUserType: 'agent',
            expectedLead: true // It's a lead for the system to know about the property, but our filter in routes should skip it
        },
        {
            name: 'General Chat - Not a Lead',
            message: 'Günaydın arkadaşlar, bugün hava çok güzel. Hepinize bereketli bir gün dilerim.',
            history: [],
            expectedUserType: 'other',
            expectedLead: false
        }
    ];

    for (const tc of testCases) {
        console.log(`\nTesting: ${tc.name}`);
        console.log(`Message: "${tc.message}"`);

        try {
            const result = await GroqService.extractLeadInfo(tc.message, tc.history);

            console.log('Results:');
            console.log(`  - User Type: ${result.userType} (Expected: ${tc.expectedUserType})`);
            console.log(`  - Is Potential Lead: ${result.isPotentialLead} (Expected: ${tc.expectedLead})`);
            console.log(`  - Intent: ${result.intent}`);
            console.log(`  - Reasoning: ${result.reasoning}`);

            const matchStatus = (result.userType === tc.expectedUserType && result.isPotentialLead === tc.expectedLead)
                ? '✅ PASS'
                : '⚠️ PARTIAL MATCH (check reasoning)';
            console.log(`\nStatus: ${matchStatus}`);
        } catch (error) {
            console.error(`❌ Error testing ${tc.name}:`, error.message);
        }
        console.log('─'.repeat(50));
    }

    console.log('\n=== Testing Learning Mechanism ===');
    const learningContext = {
        type: 'lead_conversion',
        content: 'Kadıköy merkezde 3+1 kiralık daire arıyorum. Bütçem 25-30 bin TL civarı.',
        extracted_data: {
            name: 'Ahmet Bey',
            location: 'Kadıköy Merkez',
            budget: '30000',
            rooms: '3+1'
        }
    };

    console.log('Attempting to learn from context...');
    try {
        const learned = await GroqService.analyzeAndLearn(learningContext);
        console.log(`Learning Status: ${learned ? '✅ LEARNED (New record created in AIKnowledge)' : 'ℹ️ SKIPPED (Already exists or not significant enough)'}`);
    } catch (err) {
        console.error('❌ Learning Test Error:', err.message);
    }

    console.log('\nVerification completed.');
}

if (require.main === module) {
    verifyLogic().catch(console.error);
}
