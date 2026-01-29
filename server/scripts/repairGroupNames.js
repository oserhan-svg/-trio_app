const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsappService');
const prisma = new PrismaClient();

async function repairGroupNames() {
    console.log('--- REPAIRING GROUP NAMES DIRECTLY ---');

    try {
        // Wait for WhatsApp to be ready
        if (whatsappService.status !== 'ready') {
            console.log('WhatsApp not ready. Status:', whatsappService.status);
            return;
        }

        const chats = await whatsappService.client.getChats();
        const groups = chats.filter(c => c.isGroup);

        console.log(`Found ${groups.length} groups`);
        let updatedCount = 0;

        for (const chat of groups) {
            const jid = chat.id._serialized;
            const subject = chat.name || chat.groupMetadata?.subject;

            console.log(`Group ${jid}: "${subject}"`);

            if (subject && subject !== 'WhatsApp Grup') {
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: subject, type: 'group' },
                    create: { name: subject, phone: jid, type: 'group', status: 'New' }
                });
                updatedCount++;
                console.log(`  ✓ Updated to: ${subject}`);
            } else {
                console.log(`  ✗ No valid name, using JID part: ${jid.split('@')[0]}`);
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: jid.split('@')[0], type: 'group' },
                    create: { name: jid.split('@')[0], phone: jid, type: 'group', status: 'New' }
                });
                updatedCount++;
            }
        }

        console.log(`\n✓ Repaired ${updatedCount} group names`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

repairGroupNames();
