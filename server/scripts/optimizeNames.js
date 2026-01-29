const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsappService');
const prisma = new PrismaClient();

/**
 * Consistently resolves sender name emphasizing phone contact names
 */
async function resolveSenderName(phoneNumber, waContact, waChat) {
    if (!phoneNumber) return { name: 'Bilinmeyen', isConsultant: false };
    const cleanId = String(phoneNumber).split('@')[0];
    const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);

    // 1. Resolve Name from WA Metadata
    let name = null;
    const isGroup = String(phoneNumber).includes('@g.us') || (waChat && waChat.isGroup);

    if (isGroup) {
        name = waChat?.name || waChat?.groupMetadata?.subject || waContact?.name;
        if (!name || name === 'WhatsApp Grup' || name === cleanId) {
            name = cleanId;
        }
    } else {
        const candidates = [
            waContact?.name,
            waContact?.verifiedName,
            waContact?.shortName,
            waContact?.pushname,
            waChat?.name
        ];

        name = candidates.find(c => {
            if (!c) return false;
            const cleanC = String(c).replace(/\D/g, '');
            return c !== cleanId && c !== phoneNumber && cleanC !== cleanPhone;
        });
    }

    return { name: String(name || cleanId), isConsultant: false };
}

async function run() {
    console.log('🚀 Starting Deep Name Optimization...');

    try {
        await whatsappService.initialize();

        // Wait for connection
        let retries = 0;
        while (whatsappService.status !== 'ready' && retries < 40) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries++;
            if (retries % 5 === 0) console.log(`... Waiting for WhatsApp (${whatsappService.status})`);
        }

        if (whatsappService.status !== 'ready') {
            console.error('❌ WhatsApp could not be initialized. Please scan QR in the app first.');
            process.exit(1);
        }

        const clients = await prisma.client.findMany();
        console.log(`📊 Found ${clients.length} clients in database. Syncing names...`);

        let updatedCount = 0;

        for (const client of clients) {
            const jid = client.phone.includes('@') ? client.phone : `${client.phone}${client.type === 'group' ? '@g.us' : '@c.us'}`;

            try {
                console.log(`🔍 Checking ${client.name} (${jid})...`);

                // Get chat and contact info
                const [chat, contact] = await Promise.all([
                    whatsappService.getChat(jid).catch(() => null),
                    whatsappService.getContactWithWarming(jid).catch(() => null)
                ]);

                if (!chat && !contact) {
                    console.log(`  ⚠️ Could not find WhatsApp info for ${jid}`);
                    continue;
                }

                const resolution = await resolveSenderName(client.phone, contact, chat);
                const bestName = resolution.name;

                const profilePicUrl = await whatsappService.getProfilePicUrl(jid).catch(() => null);

                const updates = {};
                if (bestName && client.name !== bestName && bestName !== client.phone && bestName !== jid.split('@')[0]) {
                    updates.name = bestName;
                    console.log(`  ✅ Name updated: ${client.name} -> ${bestName}`);
                }

                if (profilePicUrl && client.profile_pic_url !== profilePicUrl) {
                    updates.profile_pic_url = profilePicUrl;
                    console.log(`  📸 Profile pic updated for ${bestName}`);
                }

                if (Object.keys(updates).length > 0) {
                    await prisma.client.update({
                        where: { id: client.id },
                        data: updates
                    });
                    updatedCount++;
                }

            } catch (err) {
                console.error(`  ❌ Error processing ${client.phone}:`, err.message);
            }
        }

        console.log(`\n✨ Optimization Complete!`);
        console.log(`✅ Total Updated: ${updatedCount}`);

    } catch (error) {
        console.error('💥 Fatal Error:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
