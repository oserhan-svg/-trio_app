const assert = require('assert');

// Mock data
const mockConsultants = [
    { id: 1, email: 'c1@test.com', name: 'Consultant 1', _count: { clients: 10 } },
    { id: 2, email: 'c2@test.com', name: 'Consultant 2', _count: { clients: 5 } }
];

const mockPropertyStats = [
    { assigned_user_id: 1, listing_type: 'sale', _count: { id: 5 } },
    { assigned_user_id: 1, listing_type: 'rent', _count: { id: 3 } },
    { assigned_user_id: 2, listing_type: 'sale', _count: { id: 2 } }
];

const mockNewPortfolioStats = [
    { assigned_user_id: 1, _count: { id: 2 } }
];

const mockInteractionStats = [
    { consultantId: 1, count: 15 },
    { consultantId: 2, count: 4 }
];

const mockTaskStats = [
    { user_id: 1, _count: { id: 8 } }
];

// Mock Prisma
const prismaMock = {
    user: {
        findMany: async () => mockConsultants
    },
    property: {
        groupBy: async ({ where }) => {
            if (where.status === 'active') return mockPropertyStats;
            if (where.created_at) return mockNewPortfolioStats;
            return [];
        },
        findMany: async () => [
            { created_at: new Date() }, // current month
            { created_at: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15) } // last month
        ]
    },
    $queryRaw: async () => mockInteractionStats,
    agendaItem: {
        groupBy: async () => mockTaskStats
    },
    interaction: {
        findMany: async () => [
            { date: new Date() },
            { date: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 10) }
        ],
        groupBy: async () => []
    },
    client: {
        groupBy: async () => []
    }
};

// Simplified Controller Logic for verification
function mapPerformance(consultants, propertyStats, newPortfolioStats, interactionStats, taskStats) {
    return consultants.map(c => {
        const userProperties = propertyStats.filter(ps => ps.assigned_user_id === c.id);
        const saleCount = userProperties.find(ps => ps.listing_type === 'sale')?._count.id || 0;
        const rentCount = userProperties.find(ps => ps.listing_type === 'rent')?._count.id || 0;

        const newPortfolioCount = newPortfolioStats.find(ps => ps.assigned_user_id === c.id)?._count.id || 0;
        const interactionCount = interactionStats.find(is => is.consultantId === c.id)?.count || 0;
        const completedTasks = taskStats.find(ts => ts.user_id === c.id)?._count.id || 0;

        return {
            id: c.id,
            stats: {
                total_clients: c._count.clients,
                active_sale: saleCount,
                active_rent: rentCount,
                new_portfolio_monthly: newPortfolioCount,
                interactions_monthly: interactionCount,
                completed_tasks_monthly: completedTasks
            }
        };
    });
}

function verify() {
    console.log('🧪 Verifying performance mapping logic...');

    const result = mapPerformance(
        mockConsultants,
        mockPropertyStats,
        mockNewPortfolioStats,
        mockInteractionStats,
        mockTaskStats
    );

    assert.strictEqual(result.length, 2);

    // Consultant 1 checks
    assert.strictEqual(result[0].id, 1);
    assert.strictEqual(result[0].stats.active_sale, 5);
    assert.strictEqual(result[0].stats.active_rent, 3);
    assert.strictEqual(result[0].stats.new_portfolio_monthly, 2);
    assert.strictEqual(result[0].stats.interactions_monthly, 15);
    assert.strictEqual(result[0].stats.completed_tasks_monthly, 8);

    // Consultant 2 checks
    assert.strictEqual(result[1].id, 2);
    assert.strictEqual(result[1].stats.active_sale, 2);
    assert.strictEqual(result[1].stats.active_rent, 0);
    assert.strictEqual(result[1].stats.new_portfolio_monthly, 0);
    assert.strictEqual(result[1].stats.interactions_monthly, 4);
    assert.strictEqual(result[1].stats.completed_tasks_monthly, 0);

    console.log('✅ Performance mapping logic verified!');

    console.log('🧪 Verifying monthly grouping logic...');

    const now = new Date();
    const mockMonths = [
        { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0), name: 'current' },
        { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0), name: 'last' }
    ];

    const mockProperties = [
        { created_at: new Date() }, // current
        { created_at: new Date(now.getFullYear(), now.getMonth() - 1, 10) } // last
    ];

    const monthlyResult = mockMonths.map(m => {
        const count = mockProperties.filter(p => p.created_at >= m.start && p.created_at <= m.end).length;
        return { name: m.name, count };
    });

    assert.strictEqual(monthlyResult[0].count, 1);
    assert.strictEqual(monthlyResult[1].count, 1);

    console.log('✅ Monthly grouping logic verified!');
}

try {
    verify();
} catch (err) {
    console.error('❌ Verification failed:');
    console.error(err);
    process.exit(1);
}
