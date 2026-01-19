const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://127.0.0.1:5000/api';

const testDemand = {
    min_price: '',    // Frontend sends empty string for empty input
    max_price: '5000000',
    rooms: '2+1',
    district: 'Ayvalık',
    neighborhood: '150 Evler'
};

async function testDemandCreation() {
    console.log('🚀 Starting Demand Creation Test...');

    try {
        // 1. Login
        console.log('🔑 Attempting Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test_api@example.com', password: '123456' })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', await loginRes.text());
            return;
        }

        const token = (await loginRes.json()).token;
        console.log('✅ Login Successful.');

        // 2. Find a Client
        const client = await prisma.client.findFirst();
        if (!client) {
            console.error('❌ No clients found in DB. Create one first.');
            return;
        }
        console.log(`👤 Using Client: ${client.name} (ID: ${client.id})`);

        // 3. Create Demand
        console.log('📝 Sending Demand Data:', testDemand);
        const res = await fetch(`${API_URL}/clients/${client.id}/demands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testDemand)
        });

        if (res.ok) {
            console.log('✅ Demand Created Successfully:', await res.json());
        } else {
            console.error('❌ Request Failed! Status:', res.status);
            console.error('   Error:', await res.json());
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDemandCreation();
