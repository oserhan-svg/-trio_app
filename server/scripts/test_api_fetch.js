const BASE_URL = 'http://localhost:5000/api';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
    console.log('🧪 Testing API (using fetch)...');

    // 1. Create Test User
    let token;
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email: 'test_api@example.com' },
            update: { password_hash: hashedPassword },
            create: {
                email: 'test_api@example.com',
                password_hash: hashedPassword,
                role: 'admin'
            }
        });
        console.log('👤 Test User Ready:', user.email);

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test_api@example.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error(`Login status: ${loginRes.status}`);
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('✅ Login Successful. Token obtained.');

    } catch (e) {
        console.error('❌ Login Failed:', e.message);
        return;
    }

    // 2. Fetch Properties
    try {
        const res = await fetch(`${BASE_URL}/properties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Properties status: ${res.status}`);
        const data = await res.json();
        console.log(`🏠 /properties returned ${data.length} items.`);
        if (data.length > 0) {
            console.log('Sample:', data[0].title);
        } else {
            console.log('⚠️ No properties found via API.');
        }
    } catch (e) {
        console.error('❌ /properties Failed:', e.message);
    }

    // 3. Fetch Analytics
    try {
        const res = await fetch(`${BASE_URL}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Analytics status: ${res.status}`);
        const data = await res.json();
        console.log(`📊 /analytics returned data:`, Array.isArray(data) ? `Array[${data.length}]` : 'Object');
    } catch (e) {
        console.error('❌ /analytics Failed:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
