
const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function testPanelEndpoints() {
    let createdUserId = null;
    try {
        // 1. Create Temp Admin
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'testpanel@example.com',
                password_hash: hashedPassword,
                role: 'admin'
            }
        });
        createdUserId = user.id;

        // 2. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        if (!token) throw new Error('Login failed');

        // 3. Test Recent Matches
        console.log('Testing /clients/recent-matches...');
        const matchesRes = await fetch('http://localhost:5000/api/clients/recent-matches', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Recent Matches:', matchesRes.status);
        if (matchesRes.status !== 200) console.log(await matchesRes.text());

        // 4. Test Analytics
        console.log('Testing /analytics...');
        const analyticsRes = await fetch('http://localhost:5000/api/analytics', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Analytics:', analyticsRes.status);
        if (analyticsRes.status !== 200) console.log(await analyticsRes.text());

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        if (createdUserId) {
            await prisma.user.delete({ where: { id: createdUserId } });
        }
        await prisma.$disconnect();
    }
}

testPanelEndpoints();
