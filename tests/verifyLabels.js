const { scoreProperty } = require('../server/services/analyticsService');

// Mock Data
const mockStatsMap = {
    'Sarımsaklı': 40000,
    'DISTRICT:Ayvalık': 35000
};

const testCases = [
    {
        name: 'Context Check: Neighborhood',
        property: { neighborhood: 'Sarımsaklı', district: 'Ayvalık', price: 4000000, size_m2: 100 },
        expectedBasis: 'Neighborhood',
        expectedPrice: 40000
    },
    {
        name: 'Context Check: District Fallback',
        property: { neighborhood: 'Unknown', district: 'Ayvalık', price: 3500000, size_m2: 100 },
        expectedBasis: 'District',
        expectedPrice: 35000
    },
    {
        name: 'Price Drop Boost',
        property: {
            neighborhood: 'Sarımsaklı',
            district: 'Ayvalık',
            price: 3600000, // 36k/m2. Ratio = 0.9. Normally 'Uygun' (<=0.95) but not 'Fırsat' (<=0.85).
            size_m2: 100
        },
        history: [
            { change_type: 'price_decrease', changed_at: new Date().toISOString() } // Recent drop
        ],
        // Logic: Ratio 0.9 * 0.95 (Boost) = 0.855. 
        // Close to Fırsat (0.85), but 0.855 is > 0.85. 
        // Wait, 0.9 * 0.95 = 0.855. Still 'Uygun'.
        // Let's try a stronger case.
        // Price 3450000. 34.5k. Ratio 0.8625. 
        // Boost: 0.8625 * 0.95 = 0.819 -> '⚡ Fırsat'
        paramOverride: { price: 3450000 },
        expectedLabel: '⚡ Fırsat'
    }
];

console.log('--- Running Advanced Logic Verification ---');
let allPassed = true;

testCases.forEach(test => {
    const prop = { ...test.property, ...(test.paramOverride || {}) };
    const history = test.history || [];

    const result = scoreProperty(prop, mockStatsMap, history);

    let passed = true;
    let failMsg = '';

    // Check Label
    if (test.expectedLabel && result.label !== test.expectedLabel) {
        passed = false;
        failMsg += `Label mismatch. Expected ${test.expectedLabel}, got ${result.label}. `;
    }

    // Check Basis
    if (test.expectedBasis && result.comparisonBasis !== test.expectedBasis) {
        passed = false;
        failMsg += `Basis mismatch. Expected ${test.expectedBasis}, got ${result.comparisonBasis}. `;
    }

    // Check Price
    if (test.expectedPrice && result.comparisonPrice !== test.expectedPrice) {
        passed = false;
        failMsg += `Price mismatch. Expected ${test.expectedPrice}, got ${result.comparisonPrice}. `;
    }

    // Check Price Drop Flag
    if (test.history && test.history.length > 0) {
        if (!result.hasRecentPriceDrop) {
            passed = false;
            failMsg += `Flag mismatch. Expected hasRecentPriceDrop=true. `;
        }
    }

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.name}`);
    if (!passed) {
        allPassed = false;
        console.log(`   Error: ${failMsg}`);
        console.log(`   Result:`, result);
    }
});

if (allPassed) console.log('\nALL ADVANCED TESTS PASSED ✅');
else console.log('\nSOME TESTS FAILED ❌');
