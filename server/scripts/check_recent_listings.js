const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log('🔍 Checking for properties created/updated after:', oneHourAgo.toISOString());

    const recentProps = await prisma.property.findMany({
        where: {
            OR: [
                { created_at: { gte: oneHourAgo } },
                { last_scraped: { gte: oneHourAgo } }
            ]
        },
        select: {
            id: true,
            title: true,
            seller_name: true,
            external_id: true,
            created_at: true,
            last_scraped: true
        }
    });

    console.log(`📊 Found ${recentProps.length} recent properties.`);
    recentProps.forEach(p => {
        console.log(`- [${p.id}] ${p.title} | Seller: ${p.seller_name} | ExtID: ${p.external_id}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
