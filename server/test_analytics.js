const analyticsService = require('./services/analyticsService');

async function testAnalytics() {
    console.log('📊 Testing Analytics Service...');

    try {
        console.log('1. Testing BI Dashboard (All Metrics)...');
        const dashboard = await analyticsService.getBIDashboard();

        console.log('✅ Dashboard Data:', JSON.stringify(dashboard, null, 2));

        if (!dashboard.funnel || !dashboard.responseTime) {
            throw new Error('Missing new metrics in dashboard response');
        }

        console.log('2. Testing Individual Funnel...');
        const funnel = await analyticsService.getConversionFunnel();
        console.log('✅ Conversion Funnel:', funnel);

        console.log('3. Testing Efficiency...');
        const efficiency = await analyticsService.getConsultantEfficiency();
        console.log('✅ Consultant Efficiency:', efficiency);

    } catch (error) {
        console.error('❌ Analytics Test Failed:', error);
        process.exit(1);
    } finally {
        console.log('Done.');
        process.exit(0);
    }
}

testAnalytics();
