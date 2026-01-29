const whatsappService = require('./server/services/whatsappService');

async function listAllChats() {
    console.log('--- Deep Chat Sync Diagnostic ---');
    await whatsappService.initialize();

    let retries = 0;
    while (whatsappService.status !== 'ready' && retries < 40) {
        await new Promise(r => setTimeout(r, 1000));
        retries++;
        console.log(`Waiting for WhatsApp... (${whatsappService.status})`);
    }

    if (whatsappService.status !== 'ready') {
        process.exit(1);
    }

    console.log('Fetching ALL chats...');
    const chats = await whatsappService.client.getChats();
    console.log(`Found ${chats.length} chats.`);

    for (const chat of chats) {
        if (chat.isGroup) {
            console.log(`[GROUP] ${chat.id._serialized} | Name: "${chat.name}"`);
            if (!chat.name || chat.name === 'WhatsApp Grup') {
                try {
                    const metadata = await chat.getContact();
                    console.log(`  -> Contact Name: "${metadata.name}"`);
                    if (chat.groupMetadata) {
                        console.log(`  -> Group Subject: "${chat.groupMetadata.subject}"`);
                    }
                } catch (e) {
                    console.log(`  -> Metadata fetch failed.`);
                }
            }
        }
    }

    process.exit(0);
}

listAllChats();
