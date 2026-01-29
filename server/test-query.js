const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing AgendaItem query...');
        const items = await prisma.agendaItem.findMany({
            include: {
                user: {
                    select: { id: true, email: true, role: true }
                },
                client: {
                    select: { id: true, name: true }
                },
                property: {
                    select: { id: true, title: true, district: true }
                }
            },
            take: 5
        });
        console.log('Query Success! Found items:', items.length);
        console.log(JSON.stringify(items, null, 2));
    } catch (e) {
        console.error('Query Failed!');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
