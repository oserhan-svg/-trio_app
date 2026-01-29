const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const counts = {
            clients: await prisma.client.count(),
            pendingContacts: await prisma.pendingContact.count(),
            properties: await prisma.property.count(),
            demands: await prisma.demand.count(),
            interactions: await prisma.interaction.count(),
            users: await prisma.user.count(),
            deals: await prisma.deal.count(),
            agendaItems: await prisma.agendaItem.count(),
            whatsappMessages: await prisma.whatsAppMessage.count()
        };

        console.log('Final Entity Counts:', JSON.stringify(counts, null, 2));

        const tables = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\nExisting Tables:', tables.map(t => t.table_name).join(', '));

    } catch (e) {
        console.error('Final check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
