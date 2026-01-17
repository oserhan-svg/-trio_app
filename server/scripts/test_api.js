const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function main() {
    console.log('🧪 Testing API...');

    // 1. Login
    let token;
    try {
        console.log('🔑 Attempting Login...');
        // Using a default user from seed/migration or creating one if needed?
        // Wait, did I seed a user? The original db was migrated.
        // I will try a known user or I must create one directly in DB first if I can't login.
        // Actually, let's try to query DB for a user first using pure prisma in this script?
        // No, let's try to login with 'test@example.com' / 'password123' if it exists, or create it.

        // Better: Login is hard without knowing credentials.
        // I will bypass login for this test by creating a temporary script that imports app and tests internally?
        // No, I want to test HTTP.

        // I'll create a user via Prisma first.
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email: 'test_api@example.com' },
            update: {},
            create: {
                email: 'test_api@example.com',
                password_hash: hashedPassword,
                role: 'admin'
            }
        });
        console.log('👤 Test User Ready:', user.email);

        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'test_api@example.com',
            password: 'password123'
        });
        token = res.data.token;
        console.log('✅ Login Successful. Token obtained.');

    } catch (e) {
        console.error('❌ Login Failed:', e.response ? e.response.data : e.message);
        return;
    }

    // 2. Fetch Properties
    try {
        const res = await axios.get(`${BASE_URL}/properties`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`🏠 /properties returned ${res.data.length} items.`);
        if (res.data.length > 0) {
            console.log('Sample:', res.data[0].title);
        }
    } catch (e) {
        console.error('❌ /properties Failed:', e.message);
    }

    // 3. Fetch Analytics
    try {
        const res = await axios.get(`${BASE_URL}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`📊 /analytics returned data.`);
    } catch (e) {
        console.error('❌ /analytics Failed:', e.message);
    }
}

main();
