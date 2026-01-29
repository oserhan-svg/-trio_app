const prisma = require('./db');
async function run() {
    try {
        console.log('--- DB Check ---');
        const count = await prisma.property.count();
        console.log('Total Count:', count);

        const sh = await prisma.property.count({ where: { OR: [{ url: { contains: 'sahibinden.com' } }, { external_id: { startsWith: 'sh-' } }] } });
        console.log('Sahibinden:', sh);

        const he = await prisma.property.count({ where: { OR: [{ url: { contains: 'hepsiemlak.com' } }, { external_id: { startsWith: 'he-' } }] } });
        console.log('Hepsiemlak:', he);

        const ej = await prisma.property.count({ where: { OR: [{ url: { contains: 'emlakjet.com' } }, { external_id: { startsWith: 'ej-' } }] } });
        console.log('Emlakjet:', ej);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
