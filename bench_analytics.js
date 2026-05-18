// Mocking modules before they are required by controllers
const mockPrisma = {
    user: {
        findMany: async () => [
            { id: 1, name: 'C1', email: 'c1@test.com', _count: { clients: 10, agenda_items: 5, properties: 2 } },
            { id: 2, name: 'C2', email: 'c2@test.com', _count: { clients: 8, agenda_items: 3, properties: 1 } }
        ]
    },
    property: {
        count: async () => {
            mockPrisma.queryCount++;
            return 5;
        },
        groupBy: async () => {
            mockPrisma.queryCount++;
            return [];
        },
        aggregate: async () => {
            mockPrisma.queryCount++;
            return { _count: { _all: 100 }, _sum: { price: 1000000 }, _avg: { price: 10000 } };
        }
    },
    interaction: {
        count: async () => {
            mockPrisma.queryCount++;
            return 10;
        }
    },
    agendaItem: {
        count: async () => {
            mockPrisma.queryCount++;
            return 2;
        },
        groupBy: async () => {
            mockPrisma.queryCount++;
            return [];
        }
    },
    client: {
        count: async () => {
            mockPrisma.queryCount++;
            return 10;
        }
    },
    queryCount: 0,
    $queryRaw: async () => {
        mockPrisma.queryCount++;
        return [];
    }
};

const mockCache = {
    get: () => null,
    set: () => null
};

const mockAnalyticsService = {
    getNeighborhoodStatsMap: async () => ({ _heatmapData: [] }),
    getSupplyDemandStats: async () => ({ supply: 10, demand: 5, trend: 'up' })
};

function mockModule(path, exports) {
    const fullPath = require.resolve(path);
    require.cache[fullPath] = {
        id: fullPath,
        filename: fullPath,
        loaded: true,
        exports: exports
    };
}

mockModule('./server/db', mockPrisma);
mockModule('./server/services/cacheService', mockCache);
mockModule('./server/services/analyticsService', mockAnalyticsService);
mockModule('./server/services/pipelineService', {});
mockModule('./server/utils/responseHelper', { jsonBigInt: (res, data) => res.json(data) });

const { getConsultantPerformance } = require('./server/controllers/performanceController');
const { getStats } = require('./server/controllers/analyticsController');

async function runPerformanceBench() {
    console.log('--- Benchmarking Consultant Performance (N+1 check) ---');
    mockPrisma.queryCount = 0;
    const req = {};
    const res = {
        json: (data) => data,
        status: function(code) { return this; }
    };

    const start = Date.now();
    await getConsultantPerformance(req, res);
    const end = Date.now();

    console.log(`Queries executed: ${mockPrisma.queryCount}`);
    console.log(`Time taken: ${end - start}ms`);
}

async function runAnalyticsBench() {
    console.log('\n--- Benchmarking Analytics Stats ---');
    mockPrisma.queryCount = 0;
    const req = {};
    const res = {
        json: (data) => data,
        status: function(code) { return this; }
    };

    const start = Date.now();
    await getStats(req, res);
    const end = Date.now();

    console.log(`Queries executed: ${mockPrisma.queryCount}`);
    console.log(`Time taken: ${end - start}ms`);
}

async function runAll() {
    try {
        await runPerformanceBench();
        await runAnalyticsBench();
    } catch (e) {
        console.error(e);
    }
}

runAll();
