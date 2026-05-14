
const assert = require('assert');

// Mocking Prisma
let queryCount = 0;
const mockPrisma = {
    user: {
        findMany: async () => {
            queryCount++;
            return [
                { id: 1, name: 'C1', email: 'c1@test.com', _count: { clients: 1, agenda_items: 1, properties: 1 } },
                { id: 2, name: 'C2', email: 'c2@test.com', _count: { clients: 2, agenda_items: 2, properties: 2 } }
            ];
        }
    },
    property: {
        count: async () => {
            queryCount++;
            return 10;
        },
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    interaction: {
        count: async () => {
            queryCount++;
            return 5;
        },
        findMany: async () => {
            queryCount++;
            return [];
        }
    },
    agendaItem: {
        count: async () => {
            queryCount++;
            return 3;
        },
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    client: {
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    $queryRaw: async () => {
        queryCount++;
        return [];
    }
};

// Mock the db module
require.cache[require.resolve('../server/db')] = {
    exports: mockPrisma
};

const performanceController = require('../server/controllers/performanceController');

async function testPerformance() {
    console.log('--- Testing getConsultantPerformance ---');
    queryCount = 0;
    const req = {};
    const res = {
        json: (data) => {
            // console.log('Response received');
        },
        status: function(code) {
            console.log('Status set to', code);
            return this;
        }
    };

    await performanceController.getConsultantPerformance(req, res);
    console.log(`Total queries for 2 consultants: ${queryCount}`);

    // Baseline (unoptimized):
    // 1 (findMany) + 2 consultants * 5 (counts) = 11 queries
}

async function testDetail() {
    console.log('\n--- Testing getConsultantDetail ---');
    queryCount = 0;
    const req = { params: { id: '1' } };
    const res = {
        json: (data) => {
            // console.log('Response received');
        },
        status: function(code) {
            console.log('Status set to', code);
            return this;
        }
    };

    await performanceController.getConsultantDetail(req, res);
    console.log(`Total queries for detail: ${queryCount}`);

    // Baseline (unoptimized):
    // 6 months * 2 (counts) + 1 (groupBy) + 1 (findMany) = 14 queries
}

async function run() {
    try {
        await testPerformance();
        await testDetail();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
