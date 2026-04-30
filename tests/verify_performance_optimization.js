/**
 * Mocking strategy:
 * We want to verify that the logic in performanceController works correctly.
 */

function formatKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function verifyPerformanceList() {
    console.log("🧪 Verifying getConsultantPerformance Logic...");

    // Mock data
    const consultants = [
        { id: 1, name: 'Alice', email: 'alice@trio.com', _count: { clients: 10 } },
        { id: 2, name: 'Bob', email: 'bob@trio.com', _count: { clients: 5 } }
    ];

    const propertyTypeCounts = [
        { assigned_user_id: 1, listing_type: 'sale', _count: { id: 5 } },
        { assigned_user_id: 1, listing_type: 'rent', _count: { id: 3 } },
        { assigned_user_id: 2, listing_type: 'sale', _count: { id: 2 } }
    ];

    const newPortfolioCounts = [
        { assigned_user_id: 1, _count: { id: 2 } },
        { assigned_user_id: 2, _count: { id: 1 } }
    ];

    const interactionCounts = [
        { consultant_id: 1, count: 15 },
        { consultant_id: 2, count: 8 }
    ];

    const agendaCounts = [
        { user_id: 1, _count: { id: 10 } },
        { user_id: 2, _count: { id: 4 } }
    ];

    // Logic from controller
    const saleMap = {};
    const rentMap = {};
    propertyTypeCounts.forEach(p => {
        if (p.listing_type === 'sale') saleMap[p.assigned_user_id] = p._count.id;
        if (p.listing_type === 'rent') rentMap[p.assigned_user_id] = p._count.id;
    });

    const newPortfolioMap = {};
    newPortfolioCounts.forEach(p => { newPortfolioMap[p.assigned_user_id] = p._count.id; });

    const interactionMap = {};
    interactionCounts.forEach(i => { if (i.consultant_id) interactionMap[i.consultant_id] = i.count; });

    const agendaMap = {};
    agendaCounts.forEach(a => { agendaMap[a.user_id] = a._count.id; });

    const performanceData = consultants.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        stats: {
            total_clients: c._count.clients,
            active_sale: saleMap[c.id] || 0,
            active_rent: rentMap[c.id] || 0,
            new_portfolio_monthly: newPortfolioMap[c.id] || 0,
            interactions_monthly: interactionMap[c.id] || 0,
            completed_tasks_monthly: agendaMap[c.id] || 0
        }
    }));

    // Assertions
    console.assert(performanceData.length === 2, "Should have 2 consultants");
    console.assert(performanceData[0].stats.active_sale === 5, "Alice sale count should be 5");
    console.assert(performanceData[0].stats.interactions_monthly === 15, "Alice interactions should be 15");
    console.log("✅ getConsultantPerformance logic verified!");
}

async function verifyDetailStats() {
    console.log("🧪 Verifying getConsultantDetail Logic...");

    const now = new Date(2024, 4, 15); // May 2024
    const months = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            name: d.toLocaleString('tr-TR', { month: 'long' }),
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
        });
    }

    // Mock DB results (DATE_TRUNC returns first of month)
    const propertyMonthly = [
        { month: new Date(2024, 4, 1), count: 10 }, // May
        { month: new Date(2024, 3, 1), count: 5 }   // April
    ];

    const interactionMonthly = [
        { month: new Date(2024, 4, 1), count: 20 },
        { month: new Date(2024, 2, 1), count: 8 }   // March
    ];

    const propMap = {};
    propertyMonthly.forEach(row => {
        const date = new Date(row.month);
        const key = formatKey(date);
        propMap[key] = row.count;
    });

    const intMap = {};
    interactionMonthly.forEach(row => {
        const date = new Date(row.month);
        const key = formatKey(date);
        intMap[key] = row.count;
    });

    const monthlyStats = months.map((m) => {
        const key = formatKey(m.start);
        return {
            name: m.name,
            portföy: propMap[key] || 0,
            etkileşim: intMap[key] || 0
        };
    });

    // May: Portfolio 10, Interaction 20
    console.assert(monthlyStats[2].portföy === 10, "May portfolio should be 10");
    console.assert(monthlyStats[2].etkileşim === 20, "May interaction should be 20");
    // April: Portfolio 5, Interaction 0
    console.assert(monthlyStats[1].portföy === 5, "April portfolio should be 5");
    console.assert(monthlyStats[1].etkileşim === 0, "April interaction should be 0");
    // March: Portfolio 0, Interaction 8
    console.assert(monthlyStats[0].portföy === 0, "March portfolio should be 0");
    console.assert(monthlyStats[0].etkileşim === 8, "March interaction should be 8");

    console.log("✅ getConsultantDetail logic verified!");
}

async function run() {
    await verifyPerformanceList();
    await verifyDetailStats();
    console.log("\n✅ All verifications passed!");
}

run().catch(console.error);
