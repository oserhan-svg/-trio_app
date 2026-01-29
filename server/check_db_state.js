const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const clients = await prisma.client.findMany({
            take: 5,
            select: { id: true, name: true, phone: true, profile_pic_url: true }
        });
        console.log('--- Sample Clients ---');
        console.table(clients);

        const messages = await prisma.whatsAppMessage.findMany({
            take: 5,
            orderBy: { timestamp: 'desc' },
            select: { id: true, from: true, to: true, sender_name: true, timestamp: true }
        });
        console.log('\n--- Sample WhatsApp Messages ---');
        console.table(messages);

        const distinctPartners = await prisma.$queryRaw`
      SELECT DISTINCT ON (partner)
          CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
          sender_name
      FROM whatsapp_messages
      ORDER BY partner, timestamp DESC
      LIMIT 10
    `;
        console.log('\n--- Sample Partners from Messages ---');
        console.table(distinctPartners);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
