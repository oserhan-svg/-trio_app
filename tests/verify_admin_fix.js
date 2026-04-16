const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mocking the prisma client and bcryptjs
const mockPrisma = {
    user: {
        upsert: async (args) => {
            return args; // Return arguments to verify them
        }
    }
};

// Override require for the script to use our mock
const originalRequire = require('module').prototype.require;
require('module').prototype.require = function(path) {
    if (path === '../db') {
        return mockPrisma;
    }
    return originalRequire.apply(this, arguments);
};

async function testAdminFix() {
    console.log('Running verification for admin password reset fix...');

    const createAdmin = require('../server/scripts/createAdminPrisma');

    // We expect createAdmin to call prisma.user.upsert
    // Since we mocked it to return the args, we can capture them
    // But createAdmin doesn't return the result of upsert, it just logs.
    // So we need to wrap the mock to capture the call.

    let capturedArgs;
    mockPrisma.user.upsert = async (args) => {
        capturedArgs = args;
        return { email: args.create.email };
    };

    await createAdmin();

    assert.ok(capturedArgs, 'prisma.user.upsert should have been called');
    assert.strictEqual(capturedArgs.where.email, 'admin@emlak22.com');

    // The critical check: password_hash should NOT be in the update object
    assert.strictEqual(capturedArgs.update.password_hash, undefined, 'CRITICAL: password_hash should NOT be updated for existing users');
    assert.strictEqual(capturedArgs.update.role, 'admin', 'Role should still be updated to admin');

    // Also check it is present in create
    assert.ok(capturedArgs.create.password_hash, 'password_hash should be present in create block');
    assert.strictEqual(capturedArgs.create.email, 'admin@emlak22.com');

    console.log('✅ Verification successful: Admin password will not be reset on restart.');
}

testAdminFix().catch(err => {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
});
