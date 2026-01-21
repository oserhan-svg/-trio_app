const { scoreProperty } = require('../services/analyticsService');

// Mock Stats Map (Avg Price per m2 = 20,000 TL)
const statsMap = {
    'Test Mah.': 20000
};

// Test Cases
const testCases = [
    {
        name: 'Standard Case (At Avg Price)',
        prop: {
            neighborhood: 'Test Mah.',
            price: 2000000,
            size_m2: 100,
            seller_type: 'owner',
            features: []
        },
        expectedLabel: '✅ Uygun', // 1.0 ratio -> normally 'Normal' or 'Uygun'? 
        // Logic: <= 0.95 is Uygun. 1.0 is Normal.
        // Wait, current logic: ratio <= 0.95 -> 7.
        // 1.0 ratio -> >0.95 -> Normal.
    },
    {
        name: 'Premium Case (At Avg Price - Should get boost)',
        prop: {
            neighborhood: 'Test Mah.',
            price: 2000000,
            size_m2: 100,
            seller_type: 'owner',
            features: ['Deniz Manzaralı', 'Havuz']
        },
        // Premium -> ratio * 0.85 -> 0.85 effective.
        // ratio <= 0.85 -> Score 8 (Fırsat)
    },
    {
        name: 'New Building (At Avg Price - Should get boost)',
        prop: {
            neighborhood: 'Test Mah.',
            price: 2000000,
            size_m2: 100,
            seller_type: 'owner',
            building_age: '0',
            features: []
        },
        // Age 0 -> ratio * 0.85 -> 0.85 effective. -> Score 8
    },
    {
        name: 'Expensive Premium (30% above avg)',
        prop: {
            neighborhood: 'Test Mah.',
            price: 2600000,
            size_m2: 100,
            seller_type: 'owner',
            features: ['Lüks', 'Müstakil']
        },
        // Ratio 1.3
        // Premium -> 1.3 * 0.85 = 1.105
        // > 1.15 is High? No, < 1.15 is Normal.
        // So this should become Normal/High instead of VERY expensive.
    }
];

console.log('--- Scoring Verification ---');
testCases.forEach(tc => {
    const res = scoreProperty(tc.prop, statsMap);
    console.log(`\nCase: ${tc.name}`);
    console.log(`Input Price/m2: ${tc.prop.price / tc.prop.size_m2}`);
    console.log(`Result: Score ${res.score} | Label: ${res.label} | Premium: ${res.isPremium}`);
    console.log(`Deviation: ${res.deviation}%`);
});
