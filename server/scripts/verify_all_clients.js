const prisma = require('../db');
const { calculateMatchScore } = require('../services/matchingService');

async function verifyAllClients() {
    console.log('Starting Global Client Verification...');

    try {
        const clients = await prisma.client.findMany({
            include: {
                demands: true,
                saved_properties: {
                    include: { property: true }
                }
            }
        });

        console.log(`Found ${clients.length} clients.`);
        let failCount = 0;

        for (const client of clients) {
            process.stdout.write(`Checking Client ID ${client.id} (${client.name})... `);
            try {
                // Simulate controller logic
                if (client.saved_properties) {
                    client.saved_properties.forEach(sp => {
                        if (!sp.property) {
                            // This is the case we fixed, checking if logic holds
                            return;
                        }
                        // Test scoring
                        if (client.demands) {
                            client.demands.forEach(d => {
                                calculateMatchScore(sp.property, d);
                            });
                        }
                    });
                }
                console.log('OK');
            } catch (error) {
                console.log('\nFAILED!');
                console.error(`ERROR for Client ${client.id}:`, error.message);
                failCount++;
            }
        }

        console.log('-------------------------------------------');
        if (failCount === 0) {
            console.log('SUCCESS: All clients processed without crashing.');
        } else {
            console.log(`FAILURE: ${failCount} clients caused errors.`);
        }

    } catch (err) {
        console.error('Fatal script error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllClients();
