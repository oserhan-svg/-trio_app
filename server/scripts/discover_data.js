const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DATA DISCOVERY ---');

        const interactions = await prisma.interaction.findMany({
            include: { client: true }
        });
        console.log('Interactions:', interactions.length);

        const demands = await prisma.demand.findMany({
            include: { client: true }
        });
        console.log('Demands:', demands.length);

        const clientProperties = await prisma.clientProperty.findMany({
            include: { client: true }
        });
        console.log('ClientProperties (Matches):', clientProperties.length);

        const whatsapp = await prisma.whatsAppMessage.findMany();
        console.log('WhatsApp Messages:', whatsapp.length);

        // Check if there are any clients in 'demands' that are NOT in 'clients' table (orphaned records if constraint was missing)
        // But usually foreign keys prevent this.

        console.log('\n--- SAMPLE DATA ---');
        if (demands.length > 0) {
            console.log('Sample Demand:', JSON.stringify(demands[0], null, 2));
        }

    } catch (e) {
        console.error('Discovery failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
