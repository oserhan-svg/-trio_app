
const assert = require('assert');

// Mock data
const mockConsultants = [
    { id: 1, name: 'C1', email: 'c1@test.com', _count: { clients: 10, agenda_items: 5, properties: 2 } },
    { id: 2, name: 'C2', email: 'c2@test.com', _count: { clients: 5, agenda_items: 2, properties: 1 } }
];

const mockPropertyGroups = [
    { assigned_user_id: 1, listing_type: 'sale', _count: { _all: 5 } },
    { assigned_user_id: 1, listing_type: 'rent', _count: { _all: 3 } },
    { assigned_user_id: 2, listing_type: 'sale', _count: { _all: 2 } }
];

const mockNewPortfolios = [
    { assigned_user_id: 1, _count: { _all: 2 } },
    { assigned_user_id: 2, _count: { _all: 1 } }
];

const mockTasks = [
    { user_id: 1, _count: { _all: 4 } },
    { user_id: 2, _count: { _all: 2 } }
];

// Heuristic for interaction counts (since we need a JOIN or multiple queries, I'll use a map in the real code)
const mockInteractions = [
    { consultant_id: 1, count: 15 },
    { consultant_id: 2, count: 8 }
];

function optimizePerformanceLogic(consultants, propertyGroups, newPortfolios, tasks, interactions) {
    const propMap = {};
    propertyGroups.forEach(pg => {
        if (!propMap[pg.assigned_user_id]) propMap[pg.assigned_user_id] = { sale: 0, rent: 0 };
        propMap[pg.assigned_user_id][pg.listing_type] = pg._count._all;
    });

    const newPortMap = {};
    newPortfolios.forEach(np => {
        newPortMap[np.assigned_user_id] = np._count._all;
    });

    const taskMap = {};
    tasks.forEach(t => {
        taskMap[t.user_id] = t._count._all;
    });

    const intMap = {};
    interactions.forEach(i => {
        intMap[i.consultant_id] = i.count;
    });

    return consultants.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        stats: {
            total_clients: c._count.clients,
            active_sale: propMap[c.id]?.sale || 0,
            active_rent: propMap[c.id]?.rent || 0,
            new_portfolio_monthly: newPortMap[c.id] || 0,
            interactions_monthly: intMap[c.id] || 0,
            completed_tasks_monthly: taskMap[c.id] || 0
        }
    }));
}

try {
    const result = optimizePerformanceLogic(mockConsultants, mockPropertyGroups, mockNewPortfolios, mockTasks, mockInteractions);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].stats.active_sale, 5);
    assert.strictEqual(result[0].stats.active_rent, 3);
    assert.strictEqual(result[0].stats.interactions_monthly, 15);
    assert.strictEqual(result[1].stats.active_sale, 2);
    assert.strictEqual(result[1].stats.active_rent, 0);
    assert.strictEqual(result[1].stats.interactions_monthly, 8);

    console.log('✅ Performance Logic Optimization Verified');
} catch (e) {
    console.error('❌ Verification Failed:', e.message);
    process.exit(1);
}
