const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappService = require('../services/whatsappService');

async function resolveSenderName(phoneNumber, waContact, waChat) {
    if (!phoneNumber) return { name: 'Bilinmeyen', isConsultant: false };
    const cleanId = String(phoneNumber).split('@')[0];
    const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);

    // 1. Resolve Name from WA Metadata
    let name = null;
    const isGroup = String(phoneNumber).includes('@g.us') || (waChat && waChat.isGroup);

    if (isGroup) {
        // FOR GROUPS: Priority Order
        // 1. waChat.name (the group subject)
        // 2. Metadata subject
        name = waChat?.name || waChat?.groupMetadata?.subject || waContact?.name;

        if (!name || name === 'WhatsApp Grup' || name === cleanId) {
            name = cleanId; // Fallback to JID part
        }
    } else {
        // FOR INDIVIDUALS: Priority Order
        // 1. Saved Contact Name (Highest priority: exactly as on phone)
        // 2. Verified Business Name
        // 3. Short Name
        // 4. Pushname (Public name set by user)
        // 5. Chat Name
        const candidates = [
            waContact?.name,
            waContact?.verifiedName,
            waContact?.shortName,
            waContact?.pushname,
            waChat?.name
        ];

        // Find first candidate that isn't just a phone-number lookalike
        name = candidates.find(c => {
            if (!c) return false;
            const cleanC = String(c).replace(/\D/g, '');
            // Reject if it's identical to the phone number
            return c !== cleanId && c !== phoneNumber && cleanC !== cleanPhone;
        });
    }

    return { name: String(name || cleanId), isConsultant: false };
}

async function runRepair() {
    console.log('[REPAIR] Initializing WhatsApp for cleanup...');
    await whatsappService.initialize();

    // Wait for connection
    let retries = 0;
    while (whatsappService.status !== 'ready' && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
        console.log(`[REPAIR] Waiting for WhatsApp... (${whatsappService.status})`);
    }

    if (whatsappService.status !== 'ready') {
        console.error('[REPAIR] Could not connect to WhatsApp. Proceeding with DB cleanup only.');
    }

    // 1. Fix Group JIDs in messages
    console.log('[REPAIR] Migrating split group messages...');
    const messagesToMigrate = await prisma.whatsAppMessage.findMany({
        where: {
            whatsapp_id: { contains: '@g.us' },
            NOT: {
                OR: [
                    { from: { contains: '@g.us' } },
                    { to: { contains: '@g.us' } }
                ]
            }
        }
    });

    for (const m of messagesToMigrate) {
        const match = m.whatsapp_id.match(/_([^@\s]+@g\.us)_/);
        if (match) {
            const jid = match[1];
            await prisma.whatsAppMessage.update({
                where: { id: m.id },
                data: {
                    from: m.from === 'system' ? 'system' : jid,
                    to: m.to === 'system' ? 'system' : jid
                }
            });
        }
    }
    console.log(`[REPAIR] Migrated ${messagesToMigrate.length} messages.`);

    if (whatsappService.status === 'ready') {
        // 2. Sync Names
        const waChats = await whatsappService.getChats();
        console.log(`[REPAIR] Syncing names for ${waChats.length} chats...`);

        for (const chat of waChats) {
            const chatId = chat.id._serialized;
            const isGroup = chat.isGroup;
            const phoneNumber = isGroup ? null : chat.id.user;

            const contact = await whatsappService.getContactWithWarming(chatId);
            const profilePicUrl = await whatsappService.getProfilePicUrl(chatId);
            const resolution = await resolveSenderName(phoneNumber || chatId, contact, chat);
            const bestName = resolution.name;

            const client = await prisma.client.findFirst({
                where: { phone: isGroup ? chatId : phoneNumber }
            });

            if (client) {
                const updates = {};
                if (bestName && client.name !== bestName && bestName !== (phoneNumber || chatId)) {
                    updates.name = bestName;
                }
                if (profilePicUrl && client.profile_pic_url !== profilePicUrl) {
                    updates.profile_pic_url = profilePicUrl;
                }
                if (isGroup && client.type !== 'group') {
                    updates.type = 'group';
                }

                if (Object.keys(updates).length > 0) {
                    await prisma.client.update({
                        where: { id: client.id },
                        data: updates
                    });
                }

                await prisma.whatsAppMessage.updateMany({
                    where: {
                        OR: [
                            { from: isGroup ? chatId : phoneNumber },
                            { to: isGroup ? chatId : phoneNumber }
                        ],
                        client_id: { not: client.id }
                    },
                    data: { client_id: client.id }
                });
            } else if (bestName && bestName !== (phoneNumber || chatId)) {
                const newClient = await prisma.client.create({
                    data: {
                        name: bestName,
                        phone: isGroup ? chatId : phoneNumber,
                        type: isGroup ? 'group' : 'buyer',
                        profile_pic_url: profilePicUrl,
                        status: 'New'
                    }
                });

                await prisma.whatsAppMessage.updateMany({
                    where: {
                        OR: [
                            { from: isGroup ? chatId : phoneNumber },
                            { to: isGroup ? chatId : phoneNumber }
                        ]
                    },
                    data: { client_id: newClient.id }
                });
            }
        }
    }

    console.log('[REPAIR] All operations complete.');
    await prisma.$disconnect();
    process.exit(0);
}

runRepair().catch(err => {
    console.error('[REPAIR] Fatal Error:', err);
    process.exit(1);
});
