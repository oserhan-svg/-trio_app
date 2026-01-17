const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteExamples() {
    try {
        const deleted = await prisma.property.deleteMany({
            where: {
                OR: [
                    { url: { contains: 'example.com' } },
                    { title: { contains: 'Örnek', mode: 'insensitive' } },
                    { title: { contains: 'Test Property', mode: 'insensitive' } }
                ]
            }
        });

        console.log(`Deleted ${deleted.count} example properties.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

deleteExamples();
