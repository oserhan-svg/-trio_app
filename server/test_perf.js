const Module = require('module');
const originalRequire = Module.prototype.require;

let countCalls = 0;
let findManyCalls = 0;
let groupByCalls = 0;

const mockPrisma = {
    user: {
        findMany: async () => {
            findManyCalls++;
            return [{ id: 1, email: 'test@test.com', _count: { clients: 0, agenda_items: 0, properties: 0 }, name: 'Test' }];
        }
    },
    property: {
        count: async () => { countCalls++; return 10; }
    },
    interaction: {
        count: async () => { countCalls++; return 5; },
        findMany: async () => { return []; }
    },
    agendaItem: {
        count: async () => { countCalls++; return 3; }
    },
    client: {
        groupBy: async () => { groupByCalls++; return [{ status: 'active', _count: { id: 2 } }]; }
    }
};

Module.prototype.require = function (id) {
    if (id === '../db' || id.endsWith('db')) {
        return mockPrisma;
    }
    return originalRequire.call(this, id);
};

const { getConsultantPerformance, getConsultantDetail } = require('./controllers/performanceController');

const mockRes = {
    json: () => console.log('Response OK'),
    status: (code) => {
        return { json: () => console.log('Error', code) };
    }
};

(async () => {
    console.log('Testing getConsultantPerformance...');
    countCalls = 0;
    await getConsultantPerformance({}, mockRes);
    console.log(`countCalls: ${countCalls}`);

    console.log('Testing getConsultantDetail...');
    countCalls = 0;
    await getConsultantDetail({ params: { id: '1' } }, mockRes);
    console.log(`countCalls: ${countCalls}`);
})();
