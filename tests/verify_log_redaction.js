const assert = require('assert');

// Mock dependencies
const mockPrisma = {
    user: {
        update: async () => ({ id: 1, email: 'test@example.com', name: 'Test', role: 'admin' })
    }
};

// Mock bcrypt
const mockBcrypt = {
    hash: async () => 'hashed_password'
};

// Mock the module requirements BEFORE requiring the controller
require.cache[require.resolve('../server/db')] = {
    exports: mockPrisma
};
require.cache[require.resolve('bcrypt')] = {
    exports: mockBcrypt
};

const { updateUser } = require('../server/controllers/userController');

async function testLogRedaction() {
    console.log('Running testLogRedaction...');

    let loggedData = [];

    const originalLog = console.log;
    console.log = (...args) => {
        loggedData.push(args);
    };

    const req = {
        params: { id: '1' },
        body: {
            email: 'test@example.com',
            password: 'secret_password',
            name: 'Test'
        }
    };

    const res = {
        json: function(data) { this.sentData = data; },
        status: function() { return this; },
        sentData: null
    };

    try {
        await updateUser(req, res);

        const logs = loggedData;
        console.log = originalLog; // Restore console.log

        console.log('All Captured Logs:', JSON.stringify(logs, null, 2));

        // Find the log that matches our pattern
        // The log is: console.log(`[UPDATE USER] ID: ${id}, Body:`, logBody);
        // This results in two arguments to console.log:
        // arg[0]: "[UPDATE USER] ID: 1, Body:"
        // arg[1]: logBody object

        const updateLog = logs.find(log => log[0] && log[0].includes('[UPDATE USER]'));
        assert.ok(updateLog, 'Should have logged the update attempt');

        const loggedBody = updateLog[1];
        console.log('Logged Body:', loggedBody);

        assert.strictEqual(loggedBody.password, '[REDACTED]', 'Password should be redacted in logs');
        assert.strictEqual(req.body.password, 'secret_password', 'Original req.body should not be modified');

        console.log('✅ Test Passed: Password redacted in logs.');
    } catch (error) {
        console.log = originalLog; // Restore console.log
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

testLogRedaction();
