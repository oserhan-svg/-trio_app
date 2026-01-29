const prisma = require('./db');
const whatsappService = require('./services/whatsappService');

async function fixNames() {
    try {
        console.log('Fetching clients with placeholder names...');
        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: 'WhatsApp' } },
                    { name: { contains: 'Grup' } }
                ]
            }
        });

        // Also find clients whose names are just digits
        const allClients = await prisma.client.findMany();
        const numericClients = allClients.filter(c => /^\d+$/.test(c.name.replace(/\D/g, '')) && c.name.length > 5);

        const targets = [...new Set([...clients, ...numericClients])];
        console.log(`Found ${targets.length} potential candidates for name correction.`);

        if (targets.length === 0) {
            console.log('No clients need fixing.');
            return;
        }

        console.log('Checking WhatsApp connection status...');
        const status = whatsappService.getStatus();
        if (status.status !== 'ready') {
            console.error('WhatsApp is not connected. Please connect WhatsApp first.');
            return;
        }

        let fixedCount = 0;
        for (const client of targets) {
            console.log(`Processing ${client.name} (${client.phone})...`);
            try {
                const resolution = await whatsappService.resolveName(client.phone, null, null);

                if (resolution.name && resolution.name !== client.name && !resolution.name.includes('WhatsApp')) {
                    console.log(`   Found better name: ${resolution.name}`);
                    await prisma.client.update({
                        where: { id: client.id },
                        data: { name: resolution.name }
                    });
                    fixedCount++;
                } else {
                    console.log(`   No better name found.`);
                }
            } catch (err) {
                console.error(`   Error resolving name for ${client.phone}:`, err.message);
            }
        }

        console.log(`Finished. Fixed ${fixedCount} names.`);
    } catch (error) {
        console.error('Error in fixNames:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Initialize WA and run fix after a delay to ensure connection is ready if it was already connected
async function run() {
    console.log('Initializing WhatsApp Service...');
    await whatsappService.initialize();

    // Wait for 'ready' status
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
        const status = whatsappService.getStatus();
        if (status.status === 'ready') {
            await fixNames();
            process.exit(0);
        }
        console.log(`Waiting for WhatsApp connection (Attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
    }

    console.error('WhatsApp failed to connect in time. Please make sure the service is running and authenticated.');
    process.exit(1);
}

run();
