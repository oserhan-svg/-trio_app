const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://127.0.0.1:5000/api';

// Test Data
const testClient = {
    name: "Debug Client " + Date.now(),
    phone: "05551234567",
    email: `debug${Date.now()}@example.com`,
    notes: "Created via debug script",
    type: "buyer"
};

async function testClientCreation() {
    console.log('🚀 Starting Client Creation Test...');

    try {
        console.log('🔑 Attempting Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@trio.com', password: '123' })
        });

        if (!loginRes.ok) {
            console.log('⚠️  Login failed. Status:', loginRes.status);
            const user = await prisma.user.findFirst();
            if (user) {
                console.log(`ℹ️  Found user in DB: ${user.email}. Try logging in with this on frontend.`);
            } else {
                console.error('❌ No users found in DB.');
            }
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login Successful.');

        // 2. Create Client
        console.log('👤 Creating Client...');
        const res = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testClient)
        });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Client Created Successfully:', data);
        } else {
            console.error('❌ Request Failed! Status:', res.status);
            const err = await res.text();
            console.error('   Error:', err);
        }

    } catch (error) {
        console.error('❌ Request Failed!', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function checkDb() {
    const user = await prisma.user.findFirst();
    if (user) {
        console.log('ℹ️  Existing User in DB:', { email: user.email, role: user.role });
        // Run test if user exists
        await testClientCreation();
    } else {
        console.warn('⚠️  No users found in database!');
    }

    // Check Client Schema
    // const clients = await prisma.client.findMany({ take: 1 });
    // console.log('Current Client Sample:', clients[0]);
}

checkDb().then(() => {
    // try running test if possible, or just exit
});
