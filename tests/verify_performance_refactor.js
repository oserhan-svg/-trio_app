
const assert = require('assert');

// Mock data
const mockConsultants = [
    { id: 1, email: 'c1@test.com', name: 'C1', _count: { clients: 10, agenda_items: 5, properties: 20 } },
    { id: 2, email: 'c2@test.com', name: 'C2', _count: { clients: 5, agenda_items: 2, properties: 10 } }
];

const mockTypeCounts = [
    { assigned_user_id: 1, listing_type: 'sale', _count: { _all: 15 } },
    { assigned_user_id: 1, listing_type: 'rent', _count: { _all: 5 } },
    { assigned_user_id: 2, listing_type: 'sale', _count: { _all: 10 } }
];

const mockMonthlyPortfolioCounts = [
    { assigned_user_id: 1, _count: { _all: 2 } },
    { assigned_user_id: 2, _count: { _all: 1 } }
];

const mockMonthlyInteractionCounts = [
    { consultantId: 1, count: 8 },
    { consultantId: 2, count: 3 }
];

const mockCompletedTaskCounts = [
    { user_id: 1, _count: { _all: 4 } },
    { user_id: 2, _count: { _all: 2 } }
];

// Mock Prisma
const prismaMock = {
    user: {
        findMany: async () => mockConsultants
    },
    property: {
        groupBy: async ({ by }) => {
            if (by.includes('listing_type')) return mockTypeCounts;
            return mockMonthlyPortfolioCounts;
        },
        findMany: async () => [
            { created_at: new Date() }
        ]
    },
    agendaItem: {
        groupBy: async () => mockCompletedTaskCounts
    },
    client: {
        groupBy: async () => []
    },
    interaction: {
        findMany: async () => []
    },
    $queryRaw: async () => mockMonthlyInteractionCounts
};

// Global require mock for prisma
// We must clear cache to ensure performanceController uses the mock
require.cache[require.resolve('../server/db')] = {
    id: require.resolve('../server/db'),
    filename: require.resolve('../server/db'),
    loaded: true,
    exports: prismaMock
};

// Now require performanceController after mocking db
delete require.cache[require.resolve('../server/controllers/performanceController')];
const performanceController = require('../server/controllers/performanceController');

async function testPerformanceController() {
    console.log('🧪 Testing getConsultantPerformance aggregation logic...');

    const req = {};
    let responseData;
    const res = {
        json: (data) => { responseData = data; },
        status: (code) => ({
            json: (data) => {
                console.error('Response Status Error:', data);
                throw new Error('Controller returned error status ' + code);
            }
        })
    };

    await performanceController.getConsultantPerformance(req, res);

    if (!responseData) {
        throw new Error('No response data received');
    }

    assert.strictEqual(responseData.length, 2);
    assert.strictEqual(responseData[0].id, 1);
    assert.strictEqual(responseData[0].stats.active_sale, 15);
    assert.strictEqual(responseData[0].stats.active_rent, 5);
    assert.strictEqual(responseData[0].stats.interactions_monthly, 8);
    assert.strictEqual(responseData[1].stats.active_rent, 0);
    assert.strictEqual(responseData[1].stats.interactions_monthly, 3);

    console.log('✅ getConsultantPerformance logic verified!');

    console.log('🧪 Testing getConsultantDetail logic...');
    const reqDetail = { params: { id: '1' } };
    await performanceController.getConsultantDetail(reqDetail, res);
    assert.ok(responseData.monthlyStats);
    assert.strictEqual(responseData.monthlyStats.length, 6);
    console.log('✅ getConsultantDetail logic verified!');
}

testPerformanceController().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
