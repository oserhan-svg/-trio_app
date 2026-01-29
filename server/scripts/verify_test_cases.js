const prisma = require('../db');

// Mock request/response for direct testing or use internal service logic if extracted.
// Since logic is inside routes, easiest way to verify without starting server is to use Prisma directly 
// to ensure the schema and DB operations implied by the route are valid.

async function verifyTestCasesCRUD() {
    console.log("1. Creating a new test case...");
    const created = await prisma.aITestCase.create({
        data: {
            input_message: "TEST_CRUD_INPUT",
            expected_intent: "testIntent",
            expected_keywords: ["key1", "key2"],
            is_golden: true,
            category: 'manual'
        }
    });
    console.log("Created ID:", created.id);

    console.log("2. Reading test cases...");
    const tests = await prisma.aITestCase.findMany({
        where: { input_message: "TEST_CRUD_INPUT" }
    });
    if (tests.length > 0) {
        console.log("Read Success. Found:", tests.length);
    } else {
        console.error("Read Failed.");
    }

    console.log("3. Deleting test case...");
    await prisma.aITestCase.delete({
        where: { id: created.id }
    });

    const check = await prisma.aITestCase.findUnique({ where: { id: created.id } });
    if (!check) {
        console.log("Delete Success.");
    } else {
        console.error("Delete Failed.");
    }
}

verifyTestCasesCRUD()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
