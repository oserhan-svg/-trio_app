const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
    console.log('--- Benchmarking Optimized Query ---');
    const userId = 1; // Sample user id

    const start = Date.now();
    const chatSummaries = await prisma.$queryRaw`
        WITH LatestMessages AS (
            SELECT DISTINCT ON (partner)
                CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
                id, content, timestamp, "from", "to", is_viewed, media_type, client_id
            FROM whatsapp_messages
            ORDER BY partner, timestamp DESC
        )
        SELECT 
            lm.*,
            c.id as "clientId", c.name as "clientName", c.profile_pic_url as "profilePicUrl",
            c.ai_delegated, c.ai_summary, c.priority_score, c.last_intent_tag,
            c.last_sentiment, c.next_best_action, c.is_stale,
            (SELECT COUNT(*)::int FROM whatsapp_messages 
             WHERE "from" = lm.partner AND "to" = 'system' AND is_viewed = false) as "unreadCount"
        FROM LatestMessages lm
        LEFT JOIN clients c ON lm.client_id = c.id
        ORDER BY lm.timestamp DESC
        LIMIT 100
    `;
    const end = Date.now();

    console.log(`Optimized query took: ${end - start}ms`);
    console.log(`Results found: ${chatSummaries.length}`);

    if (chatSummaries.length > 0) {
        console.log('Sample result:', {
            partner: chatSummaries[0].partner,
            content: chatSummaries[0].content,
            unreadCount: chatSummaries[0].unreadCount
        });
    }
}

benchmark()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
