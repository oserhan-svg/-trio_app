const prismaMock = {
    user: {
        findMany: async () => [
            { id: 1, email: 'c1@trio.com', name: 'Consultant 1', _count: { clients: 10, agenda_items: 5, properties: 3 } },
            { id: 2, email: 'c2@trio.com', name: 'Consultant 2', _count: { clients: 20, agenda_items: 10, properties: 6 } },
            { id: 3, email: 'c3@trio.com', name: 'Consultant 3', _count: { clients: 30, agenda_items: 15, properties: 9 } },
        ]
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
            return 12;
        },
        findMany: async () => {
            queryCount++;
            return [];
        },
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    agendaItem: {
        count: async () => {
            queryCount++;
            return 8;
        },
        groupBy: async () => {
            queryCount++;
            return [];
        }
    },
    client: {
        groupBy: async () => {
            queryCount++;
            return [{ status: 'New', _count: { id: 5 } }];
        }
    },
    $queryRaw: async () => {
        queryCount++;
        return [];
    }
};

let queryCount = 0;

async function benchmark() {
    console.log('--- Benchmarking getConsultantPerformance (MOCKED) ---');

    const controllerPath = require.resolve('../server/controllers/performanceController');
    delete require.cache[controllerPath];

    const dbPath = require.resolve('../server/db');
    require.cache[dbPath] = { exports: prismaMock };

    const performanceController = require('../server/controllers/performanceController');

    const req = { query: {} };
    const res = {
        json: (data) => {},
        status: (code) => ({ json: (data) => console.log('Error:', code, data) })
    };

    queryCount = 0;
    const start = Date.now();
    await performanceController.getConsultantPerformance(req, res);
    const end = Date.now();

    console.log(`[getConsultantPerformance] Queries: ${queryCount}`);
    console.log(`[getConsultantPerformance] Time: ${end - start}ms`);

    console.log('\n--- Benchmarking getConsultantDetail (MOCKED) ---');
    const reqDetail = { params: { id: '1' } };
    queryCount = 0;
    const startDetail = Date.now();
    await performanceController.getConsultantDetail(reqDetail, res);
    const endDetail = Date.now();

    console.log(`[getConsultantDetail] Queries: ${queryCount}`);
    console.log(`[getConsultantDetail] Time: ${endDetail - startDetail}ms`);
}

benchmark().catch(console.error);
