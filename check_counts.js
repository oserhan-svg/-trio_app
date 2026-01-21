const prisma = require('./server/db');

async function checkStatus() {
    try {
        const total = await prisma.property.count();
        const active = await prisma.property.count({ where: { status: 'active' } });
        const removed = await prisma.property.count({ where: { status: 'removed' } });
        const other = total - active - removed;

        console.log('--- Property Status Distribution ---');
        console.log(`Total Records: ${total}`);
        console.log(`Active: ${active}`);
        console.log(`Removed: ${removed}`);
        console.log(`Other: ${other}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
