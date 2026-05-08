const assert = require('assert');

// Mock data
const consultants = [
    { id: 1, name: 'Alice', email: 'alice@example.com', _count: { clients: 10 } },
    { id: 2, name: 'Bob', email: 'bob@example.com', _count: { clients: 5 } }
];

// Mock helper to simulate the logic I will implement
function getCount(list, consultantId, key = 'assigned_user_id') {
    const item = list.find(i => i[key] === consultantId);
    return item ? Number(item._count._all || item.count || 0) : 0;
}

async function verifyOptimization() {
    console.log('--- Verifying Performance Optimization Logic ---');

    // 1. Test Mapping logic for getConsultantPerformance
    const propertyTypeCounts = [
        { assigned_user_id: 1, listing_type: 'sale', _count: { _all: 3 } },
        { assigned_user_id: 1, listing_type: 'rent', _count: { _all: 2 } },
        { assigned_user_id: 2, listing_type: 'sale', _count: { _all: 1 } }
    ];

    const mapped = consultants.map(c => {
        const saleCount = getCount(propertyTypeCounts.filter(p => p.listing_type === 'sale'), c.id);
        const rentCount = getCount(propertyTypeCounts.filter(p => p.listing_type === 'rent'), c.id);

        return {
            id: c.id,
            stats: {
                active_sale: saleCount,
                active_rent: rentCount
            }
        };
    });

    assert.strictEqual(mapped[0].stats.active_sale, 3);
    assert.strictEqual(mapped[0].stats.active_rent, 2);
    assert.strictEqual(mapped[1].stats.active_sale, 1);
    assert.strictEqual(mapped[1].stats.active_rent, 0);
    console.log('✅ Bulk mapping logic verified.');

    // 2. Test Time-series mapping for getConsultantDetail
    const rawMonthlyStats = [
        { month_key: '2023-10', count: 5 },
        { month_key: '2023-09', count: 3 }
    ];

    const months = [
        { name: 'Ekim', year: 2023, month: 9 }, // October is 9
        { name: 'Eylül', year: 2023, month: 8 }
    ];

    const monthlyStats = months.map(m => {
        const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
        const stat = rawMonthlyStats.find(s => s.month_key === key);
        return {
            name: m.name,
            count: stat ? Number(stat.count) : 0
        };
    });

    assert.strictEqual(monthlyStats[0].count, 5);
    assert.strictEqual(monthlyStats[1].count, 3);
    console.log('✅ Time-series bulk mapping logic verified.');

    console.log('--- Verification Successful ---');
}

verifyOptimization().catch(err => {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
});
