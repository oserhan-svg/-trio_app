const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepCleanup() {
    console.log('--- STARTING REFINED DEEP CLEANUP ---');

    // 1. Map all group JIDs to Client IDs for fast lookup
    console.log('1. Identifying group clients...');
    const groupClients = await prisma.client.findMany({
        where: { phone: { contains: '@g.us' } }
    });
    const jidToClientId = {};
    groupClients.forEach(c => jidToClientId[c.phone] = c.id);

    // 2. Re-map split messages
    console.log('2. Re-mapping group messages...');
    const allGroupMsgs = await prisma.whatsAppMessage.findMany({
        where: { whatsapp_id: { contains: '@g.us' } }
    });

    let remappedCount = 0;
    for (const msg of allGroupMsgs) {
        const match = msg.whatsapp_id.match(/(?:true|false)_([^@]+@g\.us)_/);
        if (match) {
            const groupJid = match[1];
            const isFromMe = msg.from === 'system' || msg.whatsapp_id.startsWith('true');

            const newFrom = isFromMe ? 'system' : groupJid;
            const newTo = isFromMe ? groupJid : 'system';
            const correctClientId = jidToClientId[groupJid] || msg.client_id;

            if (msg.from !== newFrom || msg.to !== newTo || msg.client_id !== correctClientId) {
                await prisma.whatsAppMessage.update({
                    where: { id: msg.id },
                    data: { from: newFrom, to: newTo, client_id: correctClientId }
                });
                remappedCount++;
            }
        }
    }
    console.log(`   Remapped ${remappedCount} messages to their correct group JIDs and clients.`);

    // 3. Delete individual clients that have NO messages (orphans)
    console.log('3. Deleting pseudo-clients (participants with no private chats)...');
    const buyers = await prisma.client.findMany({
        where: { type: 'buyer' }
    });

    let deletedBuyers = 0;
    for (const buyer of buyers) {
        const msgCount = await prisma.whatsAppMessage.count({
            where: {
                OR: [
                    { from: buyer.phone },
                    { to: buyer.phone }
                ]
            }
        });

        if (msgCount === 0) {
            // Find messages that might still be linked to this client_id but have different JIDs (shouldn't happen now but just in case)
            const remainingLinkedMsgs = await prisma.whatsAppMessage.findMany({
                where: { client_id: buyer.id },
                select: { id: true }
            });

            const msgIds = remainingLinkedMsgs.map(m => m.id);
            if (msgIds.length > 0) {
                await prisma.aIRecommendation.deleteMany({ where: { message_id: { in: msgIds } } });
                await prisma.whatsAppMessage.deleteMany({ where: { id: { in: msgIds } } });
            }

            await prisma.demand.deleteMany({ where: { client_id: buyer.id } });
            await prisma.client.delete({ where: { id: buyer.id } });
            deletedBuyers++;
        }
    }
    console.log(`   Deleted ${deletedBuyers} individual client records that were group-only.`);

    console.log('--- CLEANUP FINISHED ---');
}

deepCleanup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
