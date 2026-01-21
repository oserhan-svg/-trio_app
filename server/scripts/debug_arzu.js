
const prisma = require('../db');

async function debugArzu() {
    try {
        const client = await prisma.client.findUnique({
            where: { id: 4 },
            include: {
                saved_properties: {
                    include: { property: true }
                }
            }
        });

        if (!client) return console.log("Not found");

        console.log(`--- Client: ${client.name} (ID: ${client.id}) ---`);
        client.saved_properties
            .sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
            .forEach((sp, i) => {
                console.log(`${i + 1}. [${sp.added_at.toISOString()}] ${sp.property.price} TL - ${sp.property.url}`);
            });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugArzu();
