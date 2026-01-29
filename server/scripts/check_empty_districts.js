const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emptyDistrictProps = await prisma.property.findMany({
        where: {
            OR: [
                { district: '' },
                { district: null }
            ]
        },
        take: 10,
        select: { id: true, url: true, title: true, district: true }
    });

    console.log('Sample properties with empty district:', emptyDistrictProps);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
