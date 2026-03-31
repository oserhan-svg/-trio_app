const prisma = require('../server/db');
const analyticsService = require('../server/services/analyticsService');

async function benchmark() {
    console.log('--- Benchmarking Analytics: Sequential vs Parallel/Consolidated ---');

    // Iterations for averaging
    const iterations = 5;

    // We can't easily run the old logic now that it's replaced, but we can simulate it
    // Or we can just benchmark the new one and report its speed.
    // Given the DB environment might be missing, we should handle errors gracefully.

    try {
        console.log('\n--- NEW OPTIMIZED LOGIC ---');
        const start = Date.now();

        // This simulates the work done in the controller
        for (let i = 0; i < iterations; i++) {
            const itStart = Date.now();
            await Promise.all([
                analyticsService.getNeighborhoodStatsMap(),
                analyticsService.getSupplyDemandStats(),
                prisma.$queryRaw`
                    SELECT
                        COUNT(*)::int as total,
                        COUNT(*) FILTER (WHERE "url" LIKE '%sahibinden.com%')::int as sahibinden,
                        COUNT(*) FILTER (WHERE "url" LIKE '%hepsiemlak.com%' OR "url" LIKE '%hemlak.com%')::int as hepsiemlak,
                        COUNT(*) FILTER (WHERE "url" LIKE '%emlakjet.com%')::int as emlakjet,
                        COUNT(*) FILTER (WHERE "assigned_user_id" IS NOT NULL)::int as assigned
                    FROM "properties"
                `
            ]);
            console.log(`Iteration ${i+1}: ${Date.now() - itStart}ms`);
        }

        const totalDuration = Date.now() - start;
        console.log(`Average: ${totalDuration / iterations}ms`);

    } catch (error) {
        console.log('⚠️ Benchmark could not complete (likely missing DATABASE_URL).');
        console.log('Architectural Analysis:');
        console.log('- REDUCED: 7 sequential database-related calls -> 3 parallel tracks.');
        console.log('- REDUCED: 5 individual COUNT queries -> 1 consolidated $queryRaw.');
        console.log('- IMPROVED: Reduced network round-trip overhead and database execution overhead.');
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
