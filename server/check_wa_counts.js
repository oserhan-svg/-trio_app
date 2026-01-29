const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const messageCount = await prisma.whatsAppMessage.count();
    console.log(`Total WhatsApp Messages: ${messageCount}`);

    const clientCount = await prisma.client.count();
    console.log(`Total Clients: ${clientCount}`);

    console.log('\nTesting /chats query performance...');
    const start = Date.now();
    const chatPartners = await prisma.whatsAppMessage.findMany({
        select: { from: true, to: true },
        distinct: ['from', 'to'],
        orderBy: { timestamp: 'desc' }
    });
    const end = Date.now();
    console.log(`Distinct query took: ${end - start}ms`);
    console.log(`Unique partners found: ${chatPartners.length}`);

    // Test specific phone queries
    if (chatPartners.length > 0) {
        const samplePhone = chatPartners[0].from === 'system' ? chatPartners[0].to : chatPartners[0].from;
        console.log(`\nTesting last message query for ${samplePhone}...`);
        const start2 = Date.now();
        await prisma.whatsAppMessage.findFirst({
            where: {
                OR: [
                    { from: samplePhone },
                    { to: samplePhone }
                ]
            },
            orderBy: { timestamp: 'desc' }
        });
        const end2 = Date.now();
        console.log(`Last message query took: ${end2 - start2}ms`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
