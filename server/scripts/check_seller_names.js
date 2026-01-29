const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const properties = await prisma.property.findMany({
        select: { seller_name: true },
        where: {
            seller_name: {
                contains: 'trio',
                mode: 'insensitive'
            }
        },
        take: 20
    });
    console.log('Sample Trio Listings:');
    console.log(JSON.stringify(properties, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
