const prisma = require('./db');

async function test() {
    console.log("Warming up...");
    await prisma.property.findFirst();

    console.log("Testing sequential...");
    const seqStart = Date.now();
    const totalProperties = await prisma.property.count();
    const sahibindenCount = await prisma.property.count({
        where: { url: { contains: 'sahibinden.com' } }
    });
    const hepsiemlakCount = await prisma.property.count({
        where: {
            OR: [
                { url: { contains: 'hepsiemlak.com' } },
                { url: { contains: 'hemlak.com' } }
            ]
        }
    });
    const emlakjetCount = await prisma.property.count({
        where: { url: { contains: 'emlakjet.com' } }
    });
    const assignedCount = await prisma.property.count({
        where: { assigned_user_id: { not: null } }
    });
    const seqEnd = Date.now();
    console.log(`Sequential took ${seqEnd - seqStart}ms`);

    console.log("Testing Promise.all...");
    const concStart = Date.now();
    const [t, s, h, e, a] = await Promise.all([
        prisma.property.count(),
        prisma.property.count({
            where: { url: { contains: 'sahibinden.com' } }
        }),
        prisma.property.count({
            where: {
                OR: [
                    { url: { contains: 'hepsiemlak.com' } },
                    { url: { contains: 'hemlak.com' } }
                ]
            }
        }),
        prisma.property.count({
            where: { url: { contains: 'emlakjet.com' } }
        }),
        prisma.property.count({
            where: { assigned_user_id: { not: null } }
        })
    ]);
    const concEnd = Date.now();
    console.log(`Concurrent took ${concEnd - concStart}ms`);

    console.log(t, s, h, e, a);

    process.exit(0);
}

test();
