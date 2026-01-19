const { clientSchema } = require('../utils/schemas');

const validData = {
    name: 'Test Client',
    phone: '',
    email: '',
    notes: '',
    type: 'buyer'
};

const invalidData = {
    name: '', // Empty name (should fail)
    phone: '123', // Too short (should fail)
    email: 'invalid-email', // Bad email (should fail)
};

console.log('Testing Valid Data (Empty optional fields)...');
const res1 = clientSchema.validate(validData);
if (res1.error) console.error('❌ Valid Data Failed:', res1.error.details);
else console.log('✅ Valid Data Passed');

console.log('\nTesting Invalid Data...');
const res2 = clientSchema.validate(invalidData, { abortEarly: false });
if (res2.error) {
    console.log('✅ Invalid Data Correctly Failed:');
    res2.error.details.forEach(d => console.log(`   - ${d.message}`));
} else {
    console.error('❌ Invalid Data PASSED (Unexpected)');
}
