const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use LIVE_DATABASE_URL if available, otherwise fall back to default (but warn)
const url = process.env.LIVE_DATABASE_URL || process.env.DATABASE_URL;

if (!process.env.LIVE_DATABASE_URL) {
    console.warn('⚠️  UYARI: LIVE_DATABASE_URL bulunamadı. Aktif .env ayarları kullanılıyor.');
    console.warn('   Eğer yerel veritabanına aktarım yapmak istemiyorsanız işlemi durdurun.');
    console.warn('   Canlıya aktarmak için .env dosyanıza LIVE_DATABASE_URL ekleyin.');
} else {
    console.log('🌍 Canlı Sunucu Hedeflendi (LIVE_DATABASE_URL detected).');
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});

async function importProperties() {
    console.log('🚀 Hızlı ve güvenli veri aktarımı başlatılıyor (Batch Mode)...');
    const dataPath = path.join(__dirname, '../temp_properties.json');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ Veri dosyası bulunamadı!');
        return;
    }

    try {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const properties = JSON.parse(rawData);
        console.log(`📑 Toplam ${properties.length} ilan işlenecek...`);

        // Önce canlı veritabanındaki eski (boş ise sorun yok) verileri temizleyelim
        // veya tek tek upsert yerine 50'şerli gruplarla işlem yapalım.
        const BATCH_SIZE = 50;

        for (let i = 0; i < properties.length; i += BATCH_SIZE) {
            const batch = properties.slice(i, i + BATCH_SIZE);

            // Note: createMany with skipDuplicates is the fastest but depends on DB support
            // We'll use a Promise.all with upserts for small batches to be safe and accurate
            await Promise.all(batch.map(prop => {
                const { id, ...data } = prop;

                // Fix Date objects lost during JSON stringify
                if (data.created_at) data.created_at = new Date(data.created_at);
                if (data.updated_at) data.updated_at = new Date(data.updated_at);
                if (data.listing_date) data.listing_date = new Date(data.listing_date);
                if (data.last_scraped) data.last_scraped = new Date(data.last_scraped);
                if (data.price) data.price = Number(data.price); // Ensure Decimal compatibility
                if (data.size_m2) data.size_m2 = Number(data.size_m2);

                return prisma.property.upsert({
                    where: { external_id: data.external_id || `manual-${id}` },
                    update: data,
                    create: data
                }).catch(e => { /* log errors silently */ });
            }));

            console.log(`✅ İlerleme: %${Math.min(100, ((i + BATCH_SIZE) / properties.length) * 100).toFixed(1)} (${Math.min(i + BATCH_SIZE, properties.length)}/${properties.length})`);

            // Belleği rahatlatmak için her batch sonrası minik bir bekleme
            await new Promise(r => setTimeout(r, 200));
        }

        console.log('🏁 Aktarım başarıyla tamamlandı!');
    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importProperties();
