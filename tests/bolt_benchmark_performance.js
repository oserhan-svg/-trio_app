// Mocking the database connection before anything else
const mockPrisma = {
    user: {
        findMany: async () => {
            queryCount++;
            return [
                { id: 1, email: 'c1@test.com', name: 'C1', _count: { clients: 10, agenda_items: 5, properties: 20 } },
                { id: 2, email: 'c2@test.com', name: 'C2', _count: { clients: 5, agenda_items: 2, properties: 10 } }
            ];
        }
    },
    property: {
        count: async () => {
            queryCount++;
            return 5;
        },
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    interaction: {
        count: async () => {
            queryCount++;
            return 3;
        },
        findMany: async () => {
            queryCount++;
            return [];
        }
    },
    agendaItem: {
        count: async () => {
            queryCount++;
            return 2;
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

let queryCount = 0;

// Set up require hook or bypass server/db.js
const path = require('path');
const dbPath = path.resolve(__dirname, '../server/db.js');
require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: mockPrisma
};

const { getConsultantPerformance, getConsultantDetail } = require('../server/controllers/performanceController');

async function benchmark() {
    console.log('--- Benchmarking Baseline ---');

    // Test getConsultantPerformance
    queryCount = 0;
    const resPerformance = {
        json: (data) => {
            // console.log('Performance data returned');
        },
        status: (code) => ({ json: (data) => {} })
    };
    await getConsultantPerformance({}, resPerformance);
    console.log(`getConsultantPerformance (N=2) Query Count: ${queryCount}`);
    const expectedForN2 = 1 + (2 * 5); // 1 findMany + 2 consultants * 5 counts
    if (queryCount === expectedForN2) {
        console.log(`✅ Baseline verified: 1 + 5N queries (found ${queryCount})`);
    } else {
        console.log(`⚠️ Baseline mismatch: Expected ${expectedForN2}, found ${queryCount}`);
    }

    // Test getConsultantDetail
    queryCount = 0;
    const resDetail = {
        json: (data) => {
            // console.log('Detail data returned');
        },
        status: (code) => ({ json: (data) => {} })
    };
    await getConsultantDetail({ params: { id: '1' } }, resDetail);
    console.log(`getConsultantDetail Query Count: ${queryCount}`);
    const expectedDetail = 12 + 1 + 1; // 12 counts (6 months * 2) + 1 groupBy + 1 findMany
    if (queryCount === expectedDetail) {
        console.log(`✅ Baseline verified: 12 + 2 queries (found ${queryCount})`);
    } else {
        console.log(`⚠️ Baseline mismatch: Expected ${expectedDetail}, found ${queryCount}`);
    }
}

benchmark().catch(console.error);
