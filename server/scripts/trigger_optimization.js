const prisma = require('../db');
const DeveloperBotService = require('../services/DeveloperBotService');
const AutoTrainService = require('../services/AutoTrainService');

async function runOptimizationCycle() {
    console.log("=== STARTING OPTIMIZATION CYCLE ===");

    // 1. Run Tests
    console.log("\n[1/2] Running Continuous Tests...");
    const testResult = await DeveloperBotService.runContinuousTests();
    console.log(`Tests Completed. Success: ${testResult.successCount}/${testResult.total}`);
    console.log(`Run ID: ${testResult.runId}`);

    // 2. Run Analysis (Auto-Train)
    console.log("\n[2/2] Running Auto-Train Analysis...");
    await AutoTrainService.analyzeTestFailures();

    // 3. Report
    console.log("\n=== REPORT ===");
    const recentRules = await prisma.aIKnowledge.findMany({
        where: { category: 'fix' },
        orderBy: { created_at: 'desc' },
        take: 5
    });

    if (recentRules.length > 0) {
        console.log("New Rules Generated:");
        recentRules.forEach(r => console.log(`- [${r.id}] ${r.content}`));
    } else {
        console.log("No new rules generated (System is either perfect or analysis failed).");
    }
}

runOptimizationCycle()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
