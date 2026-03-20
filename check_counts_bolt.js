const prisma = require('./server/db');

async function check() {
    try {
        const clientCount = await prisma.client.count();
        const messageCount = await prisma.whatsAppMessage.count();
        const interactionCount = await prisma.interaction.count();
        const propertyCount = await prisma.property.count();

        console.log('--- Counts ---');
        console.log('Clients:', clientCount);
        console.log('Messages:', messageCount);
        console.log('Interactions:', interactionCount);
        console.log('Properties:', propertyCount);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
