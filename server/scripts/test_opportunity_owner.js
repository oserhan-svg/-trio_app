const { scoreProperty } = require('../services/analyticsService');

// Mock Data
const mockStatsMap = {
    'Test Mah.': 20000 // Average price per m2
};

const mockOwnerProperty = {
    price: 1000000,
    size_m2: 100, // 10,000 per m2 (Half the average -> Great deal)
    neighborhood: 'Test Mah.',
    seller_type: 'owner',
    features: []
};

const mockOfficeProperty = {
    price: 1000000,
    size_m2: 100,
    neighborhood: 'Test Mah.',
    seller_type: 'office',
    features: []
};

const mockBankProperty = {
    price: 1000000,
    size_m2: 100,
    neighborhood: 'Test Mah.',
    seller_type: 'bank',
    features: []
};

console.log('--- Testing Opportunity Radar Logic ---');

// Test 1: Owner (Should be Opportunity)
const resultOwner = scoreProperty(mockOwnerProperty, mockStatsMap);
console.log(`Owner Property Score: ${resultOwner.score} (Expected > 5)`);
console.log(`Owner Property Label: ${resultOwner.label}`);

// Test 2: Office (Should be Rejected)
const resultOffice = scoreProperty(mockOfficeProperty, mockStatsMap);
console.log(`Office Property Score: ${resultOffice.score} (Expected 0)`);
console.log(`Office Property Label: ${resultOffice.label}`);

// Test 3: Bank (Should be Rejected)
const resultBank = scoreProperty(mockBankProperty, mockStatsMap);
console.log(`Bank Property Score: ${resultBank.score} (Expected 0)`);
console.log(`Bank Property Label: ${resultBank.label}`);

if (resultOwner.score > 5 && resultOffice.score === 0 && resultBank.score === 0) {
    console.log('✅ SUCCESS: Logic verified correctly.');
} else {
    console.error('❌ FAILURE: Logic check failed.');
    process.exit(1);
}
