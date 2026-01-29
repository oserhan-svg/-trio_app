const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncGroupsViaAPI() {
    console.log('--- API ÜZERİNDEN GRUPLARI SENKRONİZE EDİYORUM ---\n');

    try {
        // Get admin user email
        const admin = await prisma.user.findFirst({
            where: { role: 'admin' },
            select: { id: true, email: true }
        });

        if (!admin) {
            console.log('❌ Admin kullanıcı bulunamadı');
            return;
        }

        console.log('1️⃣ Admin kullanıcı:', admin.email);

        // Create a temporary session token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET || 'secret-key-change-this',
            { expiresIn: '5m' }
        );

        console.log('2️⃣ Token oluşturuldu');

        // Call sync endpoint
        console.log('3️⃣ /whatsapp/sync çağrılıyor...\n');

        const response = await axios.post(
            'http://localhost:5005/api/whatsapp/sync',
            { limit: 50 },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Sync tamamlandı!');
        console.log('   Sonuç:', response.data);

        // Check updated groups
        console.log('\n4️⃣ Güncel grup listesi:');
        const groups = await prisma.client.findMany({
            where: { type: 'group' },
            select: { name: true, phone: true }
        });

        groups.forEach(g => console.log(`  📱 ${g.name}`));

    } catch (error) {
        if (error.response) {
            console.error('❌ API Hatası:', error.response.status, error.response.data);
        } else {
            console.error('❌ Hata:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

syncGroupsViaAPI();
