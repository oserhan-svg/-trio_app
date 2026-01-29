const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractGroupNamesFromMetadata() {
    console.log('--- MESAJ METADATA\'SINDEN GRUP İSİMLERİNİ ÇIKARTIYORUM ---');

    try {
        // Get all group messages with metadata
        const groupMessages = await prisma.whatsAppMessage.findMany({
            where: {
                whatsapp_id: { contains: '@g.us' }
            },
            orderBy: { timestamp: 'desc' },
            take: 1000
        });

        console.log(`${groupMessages.length} grup mesajı bulundu`);

        // Extract group info from message IDs and metadata
        const groupInfo = {};

        for (const msg of groupMessages) {
            // Extract group JID from whatsapp_id
            const match = msg.whatsapp_id.match(/(?:true|false)_([^@]+@g\.us)_/);
            if (match) {
                const groupJid = match[1];

                if (!groupInfo[groupJid]) {
                    groupInfo[groupJid] = {
                        jid: groupJid,
                        possibleNames: new Set()
                    };
                }

                // Check metadata for group name
                if (msg.metadata && typeof msg.metadata === 'object') {
                    const meta = msg.metadata;

                    // Look for group name in various metadata fields
                    if (meta.groupName) groupInfo[groupJid].possibleNames.add(meta.groupName);
                    if (meta.group_name) groupInfo[groupJid].possibleNames.add(meta.group_name);
                    if (meta.chat_name) groupInfo[groupJid].possibleNames.add(meta.chat_name);
                }

                // Also check sender_name (might contain group name in some cases)
                // But be careful - this is usually the participant name
            }
        }

        console.log('\n📋 Bulunan grup bilgileri:');
        let updatedCount = 0;

        for (const [jid, info] of Object.entries(groupInfo)) {
            const names = Array.from(info.possibleNames).filter(n =>
                n && n !== 'WhatsApp Grup' && n !== jid && !n.includes('@')
            );

            console.log(`\nGrup: ${jid}`);
            console.log(`  Olası isimler: ${names.join(', ') || 'Bulunamadı'}`);

            if (names.length > 0) {
                // Use the first valid name found
                const groupName = names[0];
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: groupName, type: 'group' },
                    create: { name: groupName, phone: jid, type: 'group', status: 'New' }
                });
                console.log(`  ✓ Güncellendi: ${groupName}`);
                updatedCount++;
            }
        }

        if (updatedCount === 0) {
            console.log('\n⚠️ Metadata\'da grup isimleri bulunamadı.');
            console.log('WhatsApp\'ı yeniden bağlamanız gerekiyor.');
        } else {
            console.log(`\n✅ ${updatedCount} grup adı güncellendi`);
        }

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

extractGroupNamesFromMetadata();
