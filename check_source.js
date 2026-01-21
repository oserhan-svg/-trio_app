const prisma = require('./server/db');

async function checkSource() {
    try {
        const sahibinden = await prisma.property.count({ where: { url: { contains: 'sahibinden.com' }, status: 'active' } });
        const hepsiemlak = await prisma.property.count({ where: { OR: [{ url: { contains: 'hepsiemlak.com' } }, { url: { contains: 'hemlak.com' } }], status: 'active' } });
        const emlakjet = await prisma.property.count({ where: { url: { contains: 'emlakjet.com' }, status: 'active' } });
        const total = await prisma.property.count({ where: { status: 'active' } });

        console.log('--- Property Source Breakdown (Active) ---');
        console.log(`Sahibinden: ${sahibinden}`);
        console.log(`Hepsiemlak: ${hepsiemlak}`);
        console.log(`Emlakjet: ${emlakjet}`);
        console.log(`Total Active: ${total}`);
        console.log(`Sum of Sources: ${sahibinden + hepsiemlak + emlakjet}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSource();
