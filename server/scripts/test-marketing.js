const prisma = require('../db');
const marketingService = require('../services/marketingService');

async function testMarketing() {
    try {
        const prop = await prisma.property.findFirst();
        if (!prop) {
            console.error('No property found');
            return;
        }
        console.log(`Testing with Property #${prop.id}`);
        const pkg = await marketingService.generateMarketingPackage(prop.id);
        console.log('Result:', pkg);
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testMarketing();
