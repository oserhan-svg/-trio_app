const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupNames() {
    console.log('🧹 [CLEANUP] Starting Client Name Cleanup...');

    try {
        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: 'WhatsApp' } },
                    { name: { contains: '@c.us' } },
                    { name: { contains: 'Bilinmeyen' } }
                ]
            }
        });

        console.log(`📊 Found ${clients.length} potential placeholder names.`);

        let fixedCount = 0;
        for (const client of clients) {
            // Check if name is purely numeric or contains WhatsApp
            const isNumeric = /^\d+$/.test(client.name.replace(/\D/g, '')) && client.name.length > 5;
            const isPlaceholder = client.name.includes('WhatsApp') || client.name.includes('Bilinmeyen');

            if (isNumeric || isPlaceholder) {
                // Peek into notes for better names (e.g., extracted by AI)
                const nameMatch = client.notes && client.notes.match(/Adı:\s*([^\n]+)/i);
                if (nameMatch && nameMatch[1].trim()) {
                    const newName = nameMatch[1].trim();
                    console.log(`✅ [FIX] ${client.name} -> ${newName} (from notes)`);
                    await prisma.client.update({
                        where: { id: client.id },
                        data: { name: newName }
                    });
                    fixedCount++;
                }
            }
        }

        console.log(`✅ Cleanup complete. Fixed ${fixedCount} names.`);
    } catch (error) {
        console.error('❌ Cleanup Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupNames();
