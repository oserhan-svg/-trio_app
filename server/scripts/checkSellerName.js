const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.property.count();
    const withSellerName = await prisma.property.count({
        where: {
            NOT: {
                OR: [
                    { seller_name: null },
                    { seller_name: 'Bilinmiyor' },
                    { seller_name: '' }
                ]
            }
        }
    });

    console.log('Total properties:', total);
    console.log('Properties with seller_name:', withSellerName);

    const sample = await prisma.property.findMany({
        take: 10,
        where: { is_primary: true },
        select: { id: true, title: true, seller_name: true, external_id: true }
    });

    console.log('\nSample Properties:');
    sample.forEach(p => {
        console.log(`ID: ${p.id}, ExtID: ${p.external_id}, Seller: ${p.seller_name}, Title: ${p.title.substring(0, 30)}...`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
