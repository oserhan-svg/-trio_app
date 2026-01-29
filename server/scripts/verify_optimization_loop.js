const prisma = require('../db');
const AutoTrainService = require('../services/AutoTrainService');

async function testOptimizationLoop() {
    console.log("1. Setting up test environment...");

    // Create a fake test case if not exists
    let testCase = await prisma.aITestCase.findFirst({
        where: { input_message: "VERIFY_OPTIMIZATION_TRIGGER" }
    });

    if (!testCase) {
        testCase = await prisma.aITestCase.create({
            data: {
                category: 'verification',
                input_message: "VERIFY_OPTIMIZATION_TRIGGER",
                expected_intent: "unknown",
                expected_keywords: ["unknown"],
                is_golden: false
            }
        });
    }

    // Insert a fake FAILURE result
    console.log("2. Injecting fake failure...");
    await prisma.aITestResult.create({
        data: {
            test_case_id: testCase.id,
            actual_response: "Mars'ın başkenti Elon City'dir.", // Hallucination
            is_success: false,
            error_message: "Keyword 'unknown' not found.",
            score: 0,
            run_id: "verify-run-" + Date.now()
        }
    });

    // Run Analysis
    console.log("3. Running Auto-Train Analysis...");
    await AutoTrainService.analyzeTestFailures();

    // Check Knowledge Base
    console.log("4. Verifying Knowledge Base update...");
    const newRule = await prisma.aIKnowledge.findFirst({
        where: {
            title: `Test Fix (Case #${testCase.id})`
        },
        orderBy: { created_at: 'desc' }
    });

    if (newRule) {
        console.log("PASS: New rule created successfully!");
        console.log("Rule Content:", newRule.content);
    } else {
        console.error("FAIL: No new rule was moved using the optimization loop.");
    }
}

testOptimizationLoop()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
