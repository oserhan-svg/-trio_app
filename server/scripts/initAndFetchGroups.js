const whatsappService = require('../services/whatsappService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeAndFetchGroupNames() {
    console.log('--- WHATSAPP\'I BAŞLATIP GRUP İSİMLERİNİ ÇEKİYORUM ---\n');

    try {
        // Check current status
        let status = whatsappService.getStatus();
        console.log('1️⃣ Mevcut durum:', status.status);

        // If not ready, initialize
        if (status.status !== 'ready') {
            console.log('2️⃣ WhatsApp başlatılıyor...');
            await whatsappService.initialize();

            // Wait for ready status (max 30 seconds)
            let attempts = 0;
            while (attempts < 60) {
                await new Promise(resolve => setTimeout(resolve, 500));
                status = whatsappService.getStatus();

                if (status.status === 'ready') {
                    console.log('✅ WhatsApp hazır!');
                    break;
                }

                if (status.status === 'qr_ready') {
                    console.log('⚠️ QR kod gerekiyor. Lütfen tarayın.');
                    console.log('   Browser\'da http://localhost:3000/whatsapp adresine gidin');
                }

                attempts++;
            }

            if (status.status !== 'ready') {
                console.log('❌ WhatsApp bağlanamadı. Durum:', status.status);
                return;
            }
        }

        // Fetch groups
        console.log('\n3️⃣ Gruplar getiriliyor...');
        const chats = await whatsappService.client.getChats();
        const groups = chats.filter(c => c.isGroup);

        console.log(`   ${groups.length} grup bulundu\n`);

        let updatedCount = 0;
        for (const chat of groups) {
            const jid = chat.id._serialized;
            const subject = chat.name || chat.groupMetadata?.subject;

            console.log(`📱 Grup: ${jid}`);
            console.log(`   İsim: ${subject || 'Bulunamadı'}`);

            if (subject && subject !== 'WhatsApp Grup') {
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: subject, type: 'group' },
                    create: { name: subject, phone: jid, type: 'group', status: 'New' }
                });
                console.log(`   ✅ Güncellendi\n`);
                updatedCount++;
            } else {
                console.log(`   ⚠️ Geçersiz isim, JID kullanılıyor\n`);
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: jid.split('@')[0], type: 'group' },
                    create: { name: jid.split('@')[0], phone: jid, type: 'group', status: 'New' }
                });
                updatedCount++;
            }
        }

        console.log(`\n✅ TAMAMLANDI: ${updatedCount} grup güncellendi`);

        // Show final list
        const allGroups = await prisma.client.findMany({
            where: { type: 'group' },
            select: { name: true, phone: true }
        });

        console.log('\n📋 Güncel grup listesi:');
        allGroups.forEach(g => console.log(`  - ${g.name}`));

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

initializeAndFetchGroupNames();
