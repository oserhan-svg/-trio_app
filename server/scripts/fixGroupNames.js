const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGroupNames() {
    console.log('--- GRUP ADLARINI DÜZELTİYORUM ---');

    try {
        // Find all groups with placeholder names
        const groups = await prisma.client.findMany({
            where: {
                OR: [
                    { name: 'WhatsApp Grup' },
                    { phone: { contains: '@g.us' } }
                ]
            }
        });

        console.log(`${groups.length} grup bulundu`);
        let updatedCount = 0;

        for (const group of groups) {
            // Extract numeric part from JID (e.g., 120363387949557680@g.us -> 120363387949557680)
            const numericId = group.phone.split('@')[0];

            // Only update if name is placeholder or empty
            if (!group.name || group.name === 'WhatsApp Grup' || group.name === group.phone) {
                await prisma.client.update({
                    where: { id: group.id },
                    data: {
                        name: numericId,
                        type: 'group'
                    }
                });
                console.log(`✓ ${group.phone} -> ${numericId}`);
                updatedCount++;
            }
        }

        console.log(`\n✅ ${updatedCount} grup adı güncellendi`);

        // Verify
        const updatedGroups = await prisma.client.findMany({
            where: { type: 'group' },
            select: { name: true, phone: true }
        });

        console.log('\n📋 Güncel grup listesi:');
        updatedGroups.forEach(g => console.log(`  - ${g.name} (${g.phone})`));

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixGroupNames();
