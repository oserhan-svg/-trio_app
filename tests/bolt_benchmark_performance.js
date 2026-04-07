
const prisma = require('../server/db');
const performanceController = require('../server/controllers/performanceController');

async function benchmark() {
    console.log('🚀 Starting Benchmark for getConsultantPerformance...');

    // Mock req, res
    const req = { query: {} };
    const res = {
        json: (data) => {
            // console.log('Data received');
        },
        status: (code) => ({
            json: (data) => {
                console.error('Error:', data);
            }
        })
    };

    // Warm up
    await performanceController.getConsultantPerformance(req, res);

    const start = Date.now();
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
        await performanceController.getConsultantPerformance(req, res);
    }
    const end = Date.now();

    const avgTime = (end - start) / iterations;
    console.log(`⏱️ Average execution time over ${iterations} iterations: ${avgTime.toFixed(2)}ms`);
}

benchmark().catch(console.error).finally(() => prisma.$disconnect());
