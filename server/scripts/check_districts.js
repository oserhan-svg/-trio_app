const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const districts = await prisma.property.groupBy({
        by: ['district'],
        _count: {
            district: true
        }
    });

    console.log('Districts found in DB:', districts);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
