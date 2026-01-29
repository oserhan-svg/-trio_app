const prisma = require('./db');
async function run() {
    try {
        const others = await prisma.property.findMany({
            where: {
                NOT: [
                    { url: { contains: 'sahibinden.com' } },
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'emlakjet.com' } }
                ]
            },
            select: { url: true, external_id: true, title: true }
        });
        console.log(`Found ${others.length} unknown sources:`);
        others.forEach(o => console.log(`- [${o.external_id}] ${o.title}: ${o.url}`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
