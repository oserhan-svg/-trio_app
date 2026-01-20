const { runInitialDeduplication } = require('../services/deduplicationService');

async function main() {
    try {
        await runInitialDeduplication();
        process.exit(0);
    } catch (error) {
        console.error('Fatal error during deduplication:', error);
        process.exit(1);
    }
}

main();
