const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function testChats() {
    console.log('--- Testing Chats API Output ---');
    try {
        const chatSummaries = await prisma.$queryRaw`
            WITH LatestMessages AS (
                SELECT DISTINCT ON (partner)
                    CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
                    id, content, timestamp, "from", "to", is_viewed, media_type, client_id, sender_name
                FROM whatsapp_messages
                ORDER BY partner, timestamp DESC
            )
            SELECT 
                lm.*,
                c.id as "clientId", c.name as "clientName"
            FROM LatestMessages lm
            LEFT JOIN clients c ON lm.client_id = c.id
            ORDER BY lm.timestamp DESC
            LIMIT 10
        `;

        const result = chatSummaries.map(c => ({
            name: c.clientName || c.sender_name || c.partner,
            timestamp: c.timestamp,
            partner: c.partner
        }));

        // Sort in JS as well
        result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        result.forEach((r, i) => {
            console.log(`${i + 1}. [${r.timestamp}] ${r.name} (${r.partner})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testChats();
