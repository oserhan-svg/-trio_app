const prisma = require('./db');

async function debugClient() {
    console.log('Fetching client 3...');
    try {
        const client = await prisma.client.findUnique({
            where: { id: 3 },
            include: {
                demands: true,
                interactions: { orderBy: { date: 'desc' } },
                saved_properties: {
                    include: { property: true },
                    orderBy: { added_at: 'desc' }
                }
            }
        });

        if (!client) {
            console.log('Client 3 not found');
            return;
        }

        console.log('Client Name:', client.name);
        console.log('Saved Properties Count:', client.saved_properties.length);

        if (client.saved_properties.length > 0) {
            console.log('First Saved Property:', JSON.stringify(client.saved_properties[0], null, 2));
        } else {
            console.log('No saved properties found via relation.');
        }

        console.log('--- Direct Table Query ---');
        const directProps = await prisma.clientProperty.findMany({
            where: { client_id: 3 }
        });
        console.log('Direct ClientProperty records:', directProps);

        console.log('--- Checking Property Existence ---');
        if (directProps.length > 0) {
            const prop = await prisma.property.findUnique({
                where: { id: directProps[0].property_id }
            });
            console.log('Property for first record:', prop ? 'Exists' : 'MISSING');
        }

        console.log('--- Simulating Add Property (Upsert) ---');
        try {
            // Hardcoded based on what we assume the user is trying: Client 3, some Property ID from matches
            // We need a valid property ID. Let's find one first.
            const match = await prisma.property.findFirst();
            if (!match) {
                console.log('No properties found to test with.');
                return;
            }
            console.log('Testing with Property ID:', match.id);

            const record = await prisma.clientProperty.upsert({
                where: {
                    client_id_property_id: {
                        client_id: 3,
                        property_id: match.id
                    }
                },
                update: { status: 'suggested' },
                create: {
                    client_id: 3,
                    property_id: match.id,
                    status: 'suggested'
                }
            });
            console.log('Upsert SUCCESS:', record);

        } catch (error) {
            console.error('Upsert FAILED:', error);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugClient();
