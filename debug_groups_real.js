const whatsappService = require('./server/services/whatsappService');

async function debugGroupNames() {
    console.log('--- Group Name Debug ---');
    await whatsappService.initialize();

    // Wait for ready
    let retries = 0;
    while (whatsappService.status !== 'ready' && retries < 20) {
        await new Promise(r => setTimeout(r, 1000));
        retries++;
        console.log(`Waiting... ${whatsappService.status}`);
    }

    if (whatsappService.status !== 'ready') {
        console.error('Failed to connect');
        process.exit(1);
    }

    const jids = ['120363387949557680@g.us', '120363098437286617@g.us'];

    for (const jid of jids) {
        console.log(`\nFetching metadata for: ${jid}`);
        try {
            const chat = await whatsappService.client.getChatById(jid);
            const contact = await whatsappService.client.getContactById(jid);

            console.log(`Chat Name: "${chat.name}"`);
            console.log(`Contact Name: "${contact.name}"`);
            console.log(`Contact Pushname: "${contact.pushname}"`);

            const groupMetadata = chat.isGroup ? await chat.groupMetadata : null;
            if (groupMetadata) {
                console.log(`Group Subject from Metadata: "${groupMetadata.subject}"`);
            }
        } catch (e) {
            console.error(`Error for ${jid}:`, e.message);
        }
    }

    console.log('\n--- End ---');
    process.exit(0);
}

debugGroupNames();
