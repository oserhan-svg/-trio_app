/**
 * Verification script for the Admin Password Reset fix.
 * Mocks Prisma and asserts that 'password_hash' is NOT present in the 'update' block of the upsert call.
 */

const assert = require('assert');

// 1. Mock Prisma
const mockPrisma = {
    user: {
        upsert: async (args) => {
            console.log('--- UPSERT INTERCEPTED ---');
            console.log('Where:', JSON.stringify(args.where));
            console.log('Update:', JSON.stringify(args.update));
            console.log('Create:', JSON.stringify(args.create));

            // SECURITY ASSERTION: password_hash MUST NOT be in the update block
            assert.strictEqual(
                args.update.password_hash,
                undefined,
                'CRITICAL SECURITY FAILURE: password_hash is still present in the update block!'
            );

            assert.strictEqual(
                args.update.role,
                'admin',
                'Role update missing'
            );

            console.log('✅ Assertion Passed: password_hash excluded from update payload.');
            return { email: args.where.email };
        }
    }
};

// 2. Mock require for the script to use our mock
require.cache[require.resolve('../server/db')] = {
    exports: mockPrisma
};

// 3. Run the script
async function runTest() {
    try {
        console.log('Starting verification of createAdminPrisma.js (bcryptjs version)...');
        const createAdmin = require('../server/scripts/createAdminPrisma');
        await createAdmin();
        console.log('\n✨ TEST SUCCESS: Admin password fix verified successfully.');
    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        process.exit(1);
    }
}

runTest();
