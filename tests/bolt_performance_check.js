const assert = require('assert');

// Mock Prisma
class MockPrisma {
    constructor() {
        this.queryCount = 0;
        this.queries = [];
        this.user = {
            findMany: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'user', method: 'findMany', args });
                return [
                    { id: 1, email: 'c1@trio.com', name: 'Consultant 1', _count: { clients: 10, agenda_items: 5, properties: 3 }, role: 'consultant' },
                    { id: 2, email: 'c2@trio.com', name: 'Consultant 2', _count: { clients: 20, agenda_items: 10, properties: 6 }, role: 'consultant' }
                ];
            }
        };
        this.property = {
            count: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'property', method: 'count', args });
                return 5;
            },
            groupBy: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'property', method: 'groupBy', args });
                return [];
            }
        };
        this.interaction = {
            count: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'interaction', method: 'count', args });
                return 15;
            },
            findMany: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'interaction', method: 'findMany', args });
                return [];
            }
        };
        this.agendaItem = {
            count: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'agendaItem', method: 'count', args });
                return 2;
            },
            groupBy: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'agendaItem', method: 'groupBy', args });
                return [];
            }
        };
        this.client = {
            groupBy: async (args) => {
                this.queryCount++;
                this.queries.push({ model: 'client', method: 'groupBy', args });
                return [];
            }
        };
        this.$queryRaw = async (args) => {
            this.queryCount++;
            this.queries.push({ model: 'raw', method: '$queryRaw', args });
            return [];
        };
    }

    reset() {
        this.queryCount = 0;
        this.queries = [];
    }
}

const mockPrisma = new MockPrisma();

// Mock require for '../db' in the controller
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
    if (path === '../db') {
        return mockPrisma;
    }
    return originalRequire.apply(this, arguments);
};

const controller = require('../server/controllers/performanceController');

async function testPerformance() {
    console.log('--- Testing getConsultantPerformance Optimization ---');
    mockPrisma.reset();

    const req = {};
    const res = {
        json: (data) => {}
    };

    await controller.getConsultantPerformance(req, res);
    console.log('Query Count for 2 consultants:', mockPrisma.queryCount);
    assert.strictEqual(mockPrisma.queryCount, 5, 'Expected 5 queries for 2 consultants after optimization');
    console.log('Optimization confirmed for getConsultantPerformance: 11 -> 5 queries');

    console.log('\n--- Testing getConsultantDetail Optimization ---');
    mockPrisma.reset();
    const reqDetail = { params: { id: '1' } };

    // We expect: 2 ($queryRaw) + 1 (groupBy status) + 1 (findMany interactions) = 4 queries
    // Previously it was 14.
    await controller.getConsultantDetail(reqDetail, res);
    console.log('Query Count for detail (6 months):', mockPrisma.queryCount);
    assert.strictEqual(mockPrisma.queryCount, 4, 'Expected 4 queries for consultant detail after optimization');
    console.log('Optimization confirmed for getConsultantDetail: 14 -> 4 queries');
}

testPerformance().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
