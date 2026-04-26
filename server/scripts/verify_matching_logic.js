const { calculateMatchScore } = require('../services/matchingService');

// Mock Data
const saleDemand = {
    id: 1,
    min_price: null,
    max_price: 6000000,
    listing_type: 'sale',
    rooms: '3+1',
    neighborhood: 'Ayvalık',
    district: 'Ayvalık'
};

const rentProperty = {
    id: 101,
    title: 'Kiralık Daire',
    price: 20000,
    listing_type: 'rent',
    rooms: '3+1',
    neighborhood: 'Ayvalık',
    district: 'Ayvalık',
    images: ['img1.jpg'],
    created_at: new Date()
};

const saleProperty = {
    id: 102,
    title: 'Satılık Daire',
    price: 5800000,
    listing_type: 'sale',
    rooms: '3+1',
    neighborhood: 'Ayvalık',
    district: 'Ayvalık',
    images: ['img1.jpg'],
    created_at: new Date()
};

const expensiveProperty = {
    id: 103,
    title: 'Pahalı Satılık',
    price: 6200000,
    listing_type: 'sale',
    rooms: '4+1',
    neighborhood: 'Ayvalık',
    district: 'Ayvalık',
    images: ['img1.jpg'],
    created_at: new Date()
};

console.log('--- TEST 1: Sale Demand vs Rent Property (Should Fail) ---');
const result1 = calculateMatchScore(rentProperty, saleDemand);
console.log('Score:', result1.score);
console.log('Is Viable:', result1.isViable);
console.log('Reasons:', result1.reasons);
if (!result1.isViable && result1.score === 0) console.log('PASS'); else console.log('FAIL');

console.log('\n--- TEST 2: Sale Demand vs Sale Property (Should Pass) ---');
const result2 = calculateMatchScore(saleProperty, saleDemand);
console.log('Score:', result2.score);
console.log('Is Viable:', result2.isViable);
console.log('Reasons:', result2.reasons);
if (result2.isViable && result2.score >= 80) console.log('PASS'); else console.log('FAIL');

console.log('\n--- TEST 3: Sale Demand vs Over Budget Property (Should allow but penalize) ---');
const result3 = calculateMatchScore(expensiveProperty, saleDemand);
console.log('Score:', result3.score);
console.log('Is Viable:', result3.isViable);
console.log('Reasons:', result3.reasons);
// Expect viable but lower score due to price
if (result3.isViable && result3.score < result2.score) console.log('PASS'); else console.log('FAIL');
