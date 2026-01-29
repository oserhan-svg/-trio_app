const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugGropping() {
    console.log('--- WhatsApp Grouping Diagnostic ---');

    // 1. Check message grouping
    const results = await prisma.$queryRaw`
        SELECT 
            CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
            COUNT(*) as message_count,
            MIN(timestamp) as first_msg,
            MAX(timestamp) as last_msg
        FROM whatsapp_messages
        GROUP BY partner
        ORDER BY last_msg DESC
        LIMIT 20
    `;

    console.log('Top 20 conversations in DB:');
    results.forEach(r => {
        console.log(`- ${r.partner}: ${r.message_count} msgs (Last: ${r.last_msg})`);
    });

    // 2. Check for @g.us specifically
    const groups = results.filter(r => r.partner.includes('@g.us'));
    console.log(`\nFound ${groups.length} group conversations in top 20.`);

    // 3. Check if these groups have client records (for naming)
    for (const g of groups) {
        const client = await prisma.client.findFirst({
            where: { phone: g.partner }
        });
        console.log(`Group ${g.partner}: Client Name = ${client ? client.name : 'MISSING'}`);
    }

    await prisma.$disconnect();
}

debugGropping().catch(console.error);
