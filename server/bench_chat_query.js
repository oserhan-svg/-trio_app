const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
    console.log('--- Benchmarking WhatsApp Chat Query Optimization ---');

    const runQuery = async (label, query) => {
        const start = Date.now();
        const result = await prisma.$queryRaw(query);
        const end = Date.now();
        console.log(`[${label}] Took: ${end - start}ms | Rows: ${result.length}`);
        return { result, time: end - start };
    };

    // 1. Original Query Pattern (Simulated)
    const originalQuery = Prisma.sql`
        WITH LatestMessages AS (
            SELECT DISTINCT ON (partner)
                CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
                id, content, timestamp, "from", "to", is_viewed, media_type, client_id, sender_name
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
        LEFT JOIN clients c ON (c.phone = lm.partner OR c.phone = split_part(lm.partner, '@', 1))
        WHERE 1=1
        ORDER BY lm.timestamp DESC
        LIMIT 100
    `;

    // 2. Optimized Query Pattern
    const optimizedQuery = Prisma.sql`
        WITH LatestMessages AS (
            SELECT DISTINCT ON (partner)
                CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
                id, content, timestamp, "from", "to", is_viewed, media_type, client_id, sender_name
            FROM whatsapp_messages
            ORDER BY partner, timestamp DESC
        ),
        UnreadCounts AS (
            SELECT "from" as partner, COUNT(*)::int as count
            FROM whatsapp_messages
            WHERE "to" = 'system' AND is_viewed = false
            GROUP BY "from"
        )
        SELECT
            lm.*,
            c.id as "clientId", c.name as "clientName", c.profile_pic_url as "profilePicUrl",
            c.ai_delegated, c.ai_summary, c.priority_score, c.last_intent_tag,
            c.last_sentiment, c.next_best_action, c.is_stale,
            COALESCE(uc.count, 0) as "unreadCount"
        FROM LatestMessages lm
        LEFT JOIN UnreadCounts uc ON lm.partner = uc.partner
        LEFT JOIN clients c ON (c.phone = lm.partner OR c.phone = split_part(lm.partner, '@', 1))
        WHERE 1=1
        ORDER BY lm.timestamp DESC
        LIMIT 100
    `;

    try {
        console.log('Running benchmarks...');
        const oldRun = await runQuery('ORIGINAL', originalQuery);
        const newRun = await runQuery('OPTIMIZED', optimizedQuery);

        // 3. Verification of correctness
        console.log('\n--- Correctness Verification ---');
        const oldMap = new Map(oldRun.result.map(r => [r.partner, r.unreadCount]));
        let matchCount = 0;
        let mismatchCount = 0;

        newRun.result.forEach(r => {
            const oldVal = oldMap.get(r.partner);
            if (oldVal === r.unreadCount) {
                matchCount++;
            } else {
                console.warn(`Mismatch for ${r.partner}: Original=${oldVal}, Optimized=${r.unreadCount}`);
                mismatchCount++;
            }
        });

        console.log(`Verification: ${matchCount} matches, ${mismatchCount} mismatches.`);

        if (mismatchCount === 0) {
            console.log('✅ PASS: Optimization yields identical results.');
        } else {
            console.error('❌ FAIL: Optimization results differ from original.');
        }

        if (newRun.time < oldRun.time) {
            const improvement = (((oldRun.time - newRun.time) / oldRun.time) * 100).toFixed(2);
            console.log(`⚡ Performance: ${improvement}% faster.`);
        } else {
            console.log('Performance difference is negligible or slower in this environment.');
        }

    } catch (e) {
        console.error('Benchmark error:', e);
    }
}

benchmark()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
