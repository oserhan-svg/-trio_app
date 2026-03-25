const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'server/.env' });
const prisma = new PrismaClient();

async function verify() {
    console.log('--- WhatsApp Verification ---');

    try {
        // 1. Check for group chats
        const groupMessages = await prisma.whatsAppMessage.findMany({
            where: {
                from: { contains: '@g.us' }
            },
            take: 5
        });

        console.log(`Found ${groupMessages.length} group messages (grouped by @g.us).`);
        if (groupMessages.length > 0) {
            console.log('Sample group message:', {
                from: groupMessages[0].from,
                sender: groupMessages[0].sender_name,
                metadata: groupMessages[0].metadata
            });
        } else {
            console.log('No group messages found with @g.us JID yet. This might be normal if sync has not run.');
        }

        // 2. Check for consultant tags
        const consultantMessages = await prisma.whatsAppMessage.findMany({
            where: {
                metadata: {
                    path: ['is_consultant'],
                    equals: true
                }
            },
            take: 5
        });

        console.log(`Found ${consultantMessages.length} messages tagged as consultant.`);
        if (consultantMessages.length > 0) {
            console.log('Sample consultant message:', {
                sender: consultantMessages[0].sender_name,
                is_consultant: consultantMessages[0].metadata.is_consultant
            });
        }
    } catch (err) {
        console.error('Prisma query failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify().catch(console.error);
