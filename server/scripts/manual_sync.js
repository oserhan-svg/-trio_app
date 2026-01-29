const { syncPortfolio } = require('../services/scraperService');
const prisma = require('../db');

async function main() {
    try {
        console.log('Starting Manual Sync...');
        const result = await syncPortfolio();
        console.log('Sync Result:', result);
    } catch (err) {
        console.error('Manual Sync Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
