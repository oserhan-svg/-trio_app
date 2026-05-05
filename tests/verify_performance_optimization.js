// Mock @prisma/client before any other requires
const mockPrisma = {
    user: {
        findMany: async () => [
            { id: 1, email: 'c1@trio.com', name: 'Consultant 1', _count: { clients: 10, agenda_items: 5, properties: 3 } },
            { id: 2, email: 'c2@trio.com', name: 'Consultant 2', _count: { clients: 8, agenda_items: 2, properties: 5 } }
        ]
    },
    property: {
        count: async () => 5,
        findMany: async () => [],
        groupBy: async (params) => {
            if (params.by.includes('assigned_user_id')) {
                return [
                    { assigned_user_id: 1, _count: { id: 5 } },
                    { assigned_user_id: 2, _count: { id: 10 } }
                ];
            }
            return [];
        }
    },
    interaction: {
        count: async () => 10,
        findMany: async () => [],
        groupBy: async () => []
    },
    agendaItem: {
        count: async () => 3,
        groupBy: async (params) => {
            if (params.by.includes('user_id')) {
                return [
                    { user_id: 1, _count: { id: 3 } },
                    { user_id: 2, _count: { id: 7 } }
                ];
            }
            return [];
        }
    },
    client: {
        groupBy: async () => [],
        findMany: async () => []
    },
    $queryRaw: async (sql) => {
        const sqlStr = Array.isArray(sql) ? sql[0] : (sql.strings ? sql.strings[0] : '');
        console.log('Query:', sqlStr);
        if (sqlStr.includes('interactions')) {
            return [
                { consultant_id: 1, count: 12 },
                { consultant_id: 2, count: 15 }
            ];
        }
        if (sqlStr.includes('TO_CHAR')) {
             return [
                { month_key: '2025-05', count: 5 },
                { month_key: '2025-04', count: 3 }
            ];
        }
        return [];
    },
    $disconnect: async () => {}
};

let queryCounts = {
    count: 0,
    queryRaw: 0,
    findMany: 0,
    groupBy: 0
};

// Improved query counter
const proxyHandler = {
    get(target, prop) {
        const origMethod = target[prop];
        if (typeof origMethod === 'function') {
            return async (...args) => {
                if (prop === 'count') queryCounts.count++;
                if (prop === 'findMany') queryCounts.findMany++;
                if (prop === 'groupBy') queryCounts.groupBy++;
                if (prop === '$queryRaw') queryCounts.queryRaw++;
                return origMethod.apply(target, args);
            };
        }
        return origMethod;
    }
};

const proxiedPrisma = new Proxy(mockPrisma, proxyHandler);
proxiedPrisma.user = new Proxy(mockPrisma.user, proxyHandler);
proxiedPrisma.property = new Proxy(mockPrisma.property, proxyHandler);
proxiedPrisma.interaction = new Proxy(mockPrisma.interaction, proxyHandler);
proxiedPrisma.agendaItem = new Proxy(mockPrisma.agendaItem, proxyHandler);
proxiedPrisma.client = new Proxy(mockPrisma.client, proxyHandler);

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(name) {
    if (name === '@prisma/client') {
        return { PrismaClient: function() { return proxiedPrisma; }, Prisma: { sql: (strings, ...values) => ({ strings, values }) } };
    }
    if (name.endsWith('/db') || name.endsWith('../db')) {
        return proxiedPrisma;
    }
    return originalRequire.apply(this, arguments);
};

const { getConsultantPerformance, getConsultantDetail } = require('../server/controllers/performanceController');

async function runTests() {
    console.log('--- Running Performance Optimization Tests ---');

    let capturedData = null;
    const res = {
        json: (data) => {
            capturedData = data;
            return data;
        },
        status: function() { return this; }
    };

    // Test getConsultantPerformance
    queryCounts = { count: 0, queryRaw: 0, findMany: 0, groupBy: 0 };
    console.log('\nTesting getConsultantPerformance...');
    await getConsultantPerformance({}, res);
    console.log(`Query counts for getConsultantPerformance:`, queryCounts);

    // Verify mapping
    const performanceData = capturedData;
    const c1 = performanceData.find(d => d.id === 1);
    console.log('Consultant 1 stats:', c1.stats);
    if (c1.stats.completed_tasks_monthly === 3) {
        console.log('✅ completed_tasks_monthly correctly mapped!');
    } else {
        console.log('❌ completed_tasks_monthly MAPPING FAILED! Got:', c1.stats.completed_tasks_monthly);
    }
    if (c1.stats.interactions_monthly === 12) {
        console.log('✅ interactions_monthly correctly mapped!');
    } else {
        console.log('❌ interactions_monthly MAPPING FAILED! Got:', c1.stats.interactions_monthly);
    }

    // Test getConsultantDetail
    queryCounts = { count: 0, queryRaw: 0, findMany: 0, groupBy: 0 };
    console.log('\nTesting getConsultantDetail...');
    await getConsultantDetail({ params: { id: '1' } }, res);
    console.log(`Query counts for getConsultantDetail:`, queryCounts);
    const detailData = capturedData;
    console.log('Recent Interactions count:', detailData.recentInteractions.length);
}

runTests().catch(console.error);
