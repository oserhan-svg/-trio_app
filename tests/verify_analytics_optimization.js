const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock Prisma and other dependencies before requiring analyticsService
const mockPrisma = {
    property: {
        groupBy: async () => {
            console.log('   [MOCK] prisma.property.groupBy called');
            return new Promise(resolve => setTimeout(() => resolve([]), 100));
        },
        count: async () => {
            console.log('   [MOCK] prisma.property.count called');
            return new Promise(resolve => setTimeout(() => resolve(100), 50));
        },
        findMany: async () => []
    },
    client: {
        count: async () => {
            console.log('   [MOCK] prisma.client.count called');
            return new Promise(resolve => setTimeout(() => resolve(50), 50));
        }
    },
    clientInteraction: {
        findMany: async () => []
    },
    deal: {
        findMany: async () => []
    },
    user: {
        findMany: async () => []
    },
    whatsAppMessage: {
        findMany: async () => []
    },
    demand: {
        groupBy: async () => []
    }
};

// We need to bypass the actual db.js which requires @prisma/client
// We can do this by defining the module in require.cache
const dbPath = path.resolve(__dirname, '../server/db.js');
require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: mockPrisma
};

// Now require the service
const analyticsService = require('../server/services/analyticsService');

async function testCoalescing() {
    console.log('\n--- Testing Promise Coalescing ---');

    let callCount = 0;
    const originalGroupBy = mockPrisma.property.groupBy;
    mockPrisma.property.groupBy = async (...args) => {
        callCount++;
        return originalGroupBy(...args);
    };

    console.log('Executing 5 concurrent calls to getNeighborhoodStatsMap...');
    const startTime = Date.now();
    const results = await Promise.all([
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap(),
        analyticsService.getNeighborhoodStatsMap()
    ]);
    const duration = Date.now() - startTime;

    console.log(`Execution finished in ${duration}ms`);
    console.log(`DB Query Call Count: ${callCount}`);

    assert.strictEqual(callCount, 1, 'Prisma groupBy should only be called once due to coalescing');
    assert.strictEqual(results.length, 5, 'Should receive 5 results');
    console.log('✅ Coalescing test passed!');
}

async function run() {
    try {
        await testCoalescing();
        console.log('\n✨ All performance verifications passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

run();
