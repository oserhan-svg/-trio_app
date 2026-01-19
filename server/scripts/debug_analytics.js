const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

async function testAnalytics() {
    try {
        // 1. Generate a valid token locally (skipping login network call to save time/dependency)
        // We know admin@emlak22.com exists and has ID. Let's find its ID first.
        const user = await prisma.user.findUnique({ where: { email: 'admin@emlak22.com' } });
        if (!user) {
            console.error('❌ Admin user not found! Cannot test.');
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
        console.log('generated token for user:', user.email);

        // 2. Call Analytics Endpoint
        // Using built-in fetch (Node 18+)
        console.log('Requesting /analytics...');
        const res = await fetch(`${API_URL}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Analytics Success!');
            // Print a summary, not the whole bigInt blob
            console.log('Keys received:', Object.keys(data));
        } else {
            console.error(`❌ Request Failed. Status: ${res.status}`);
            const text = await res.text(); // Get raw text in case JSON parsing fails
            console.error('Response:', text);
        }

    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testAnalytics();
