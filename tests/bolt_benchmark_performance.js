const prisma = require('../server/db');

async function benchmark() {
    console.log('🚀 Benchmarking performanceController...');

    // Ensure we have some data
    const consultants = await prisma.user.findMany({ where: { role: 'consultant' }, take: 5 });
    if (consultants.length === 0) {
        console.log('⚠️ No consultants found, performance metrics might be misleading.');
    }

    const start = Date.now();

    // We mock req, res
    const req = { query: {}, params: {} };
    const res = {
        json: (data) => {
            const end = Date.now();
            console.log(`✅ Request finished in ${end - start}ms`);
        },
        status: function(s) { this.statusCode = s; return this; }
    };

    const performanceController = require('../server/controllers/performanceController');

    console.log('Testing getConsultantPerformance...');
    await performanceController.getConsultantPerformance(req, res);

    if (consultants.length > 0) {
        console.log(`Testing getConsultantDetail for consultant ${consultants[0].id}...`);
        const detailStart = Date.now();
        const detailRes = {
            json: (data) => {
                const detailEnd = Date.now();
                console.log(`✅ Detail request finished in ${detailEnd - detailStart}ms`);
            },
            status: function(s) { this.statusCode = s; return this; }
        };
        await performanceController.getConsultantDetail({ params: { id: String(consultants[0].id) } }, detailRes);
    }

    await prisma.$disconnect();
}

benchmark().catch(err => {
    console.error(err);
    process.exit(1);
});
