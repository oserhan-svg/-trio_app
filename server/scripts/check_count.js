const prisma = require('../db');

async function checkCount() {
    try {
        const count = await prisma.property.count();
        console.log(`Total Properties: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCount();
