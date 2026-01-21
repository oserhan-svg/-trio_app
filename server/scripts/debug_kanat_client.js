
const prisma = require('../db');

async function debugClient() {
    try {
        // Find client by name (fuzzy search)
        const clients = await prisma.client.findMany({
            where: {
                name: { contains: 'Kanat' }
            },
            include: {
                demands: true,
                saved_properties: {
                    include: {
                        property: true
                    }
                }
            }
        });

        if (clients.length === 0) {
            console.log('No client found with name "Kanat"');
            return;
        }

        for (const client of clients) {
            console.log(`--- Client: ${client.name} (ID: ${client.id}) Type: ${client.type} ---`);
            console.log(`Demands: ${JSON.stringify(client.demands)}`);
            console.log(`Saved Properties Count (Raw DB): ${client.saved_properties.length}`); // added count

            client.saved_properties.forEach((sp, index) => {
                const p = sp.property;
                if (!p) {
                    console.log(`   ${index + 1}. [NULL PROPERTY] ID: ${sp.property_id}`);
                } else {
                    console.log(`   ${index + 1}. [ID: ${p.id}] ${p.title}`);
                    console.log(`       URL: ${p.url}`);
                    console.log(`       Price: ${p.price}`);
                    console.log(`       Added At: ${sp.added_at}`);
                }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugClient();
