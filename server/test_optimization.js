const aiLearningService = require('./services/aiLearningService');
const prisma = require('./db');

async function test() {
    console.log('Starting optimization test...');
    try {
        console.log('Testing Property findMany...');
        await prisma.property.findMany({ take: 1 });
        console.log('Property OK');

        console.log('Testing Client findMany...');
        await prisma.client.findMany({ take: 1 });
        console.log('Client OK');

        const result = await aiLearningService.runOptimization();
        console.log('Result:', result);
    } catch (error) {
        console.error('OPTIMIZATION FAILED WITH ERROR:');
        console.error(error);
        if (error.stack) console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
