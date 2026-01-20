const prisma = require('../db');
const { calculateMatchScore } = require('../services/matchingService');

async function verifyClientLoad(clientId) {
    console.log(`Verifying load for Client ID: ${clientId}...`);

    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: {
                demands: true,
                saved_properties: {
                    include: { property: true }
                }
            }
        });

        if (!client) {
            console.log('Client not found.');
            return;
        }

        console.log(`Client found: ${client.name}`);
        console.log(`Saved Properties: ${client.saved_properties.length}`);
        console.log(`Demands: ${client.demands.length}`);

        console.log('Testing Match Score Calculation...');

        let successCount = 0;
        let failCount = 0;

        for (const sp of client.saved_properties) {
            try {
                if (!sp.property) {
                    console.log(`[WARN] property is null for saved_property id ${sp.id}`);
                    continue;
                }

                let bestScore = 0;
                for (const demand of client.demands) {
                    const { score } = calculateMatchScore(sp.property, demand);
                    if (score > bestScore) bestScore = score;
                }
                successCount++;
            } catch (err) {
                console.error(`[ERROR] Failed to score property ${sp.property_id}:`, err.message);
                failCount++;
            }
        }

        console.log(`Verification Result: ${successCount} scored successfully, ${failCount} failed.`);

        if (failCount === 0) {
            console.log('PASS: Client data handles correctly.');
        } else {
            console.log('FAIL: Backend crash logic detected.');
        }

    } catch (error) {
        console.error('Fatal Error fetching client:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Check ID 10 as seen in logs, or find a client with properties
async function run() {
    // Find a client who has at least one property to test with, or default to 10
    const cp = await prisma.clientProperty.findFirst();
    const id = cp ? cp.client_id : 10;

    await verifyClientLoad(id);
}

run();
