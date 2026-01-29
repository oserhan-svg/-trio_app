const { performance } = require('perf_hooks');
const { findMatchesForClient } = require('../services/matchingService');
const prisma = require('../db');

async function benchmark() {
    console.log('🚀 Matching Performance Benchmark\n');

    // Find a client with demands for testing
    const client = await prisma.client.findFirst({
        where: {
            demands: {
                some: {}
            }
        },
        include: {
            demands: true
        }
    });

    if (!client) {
        console.log('❌ No client with demands found for testing');
        process.exit(1);
    }

    console.log(`Testing with client: ${client.name} (${client.demands.length} demands)\n`);

    // Warm up (first query initializes connections)
    console.log('Warming up...');
    await findMatchesForClient(client.id);
    console.log('Warm up complete.\n');

    // Run benchmark iterations
    const iterations = 10;
    const times = [];

    console.log(`Running ${iterations} iterations...\n`);

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const matches = await findMatchesForClient(client.id);
        const end = performance.now();
        const duration = end - start;
        times.push(duration);

        console.log(`Iteration ${i + 1}: ${duration.toFixed(2)}ms (${matches.length} matches found)`);
    }

    // Calculate statistics
    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

    console.log('\n📊 Results:');
    console.log('─'.repeat(40));
    console.log(`Average: ${avg.toFixed(2)}ms`);
    console.log(`Median:  ${median.toFixed(2)}ms`);
    console.log(`Min:     ${min.toFixed(2)}ms`);
    console.log(`Max:     ${max.toFixed(2)}ms`);
    console.log('─'.repeat(40));

    // Performance targets
    const target = 50;
    const status = avg < target ? '✅ PASS' : '❌ FAIL';
    console.log(`\nTarget: <${target}ms average`);
    console.log(`Status: ${status}\n`);

    // Exit with appropriate code
    await prisma.$disconnect();
    process.exit(avg < target ? 0 : 1);
}

// Run benchmark
benchmark().catch(error => {
    console.error('Benchmark error:', error);
    prisma.$disconnect();
    process.exit(1);
});
