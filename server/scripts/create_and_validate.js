const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const email = `temp_admin_${Date.now()}@test.com`;
    const password = 'temp_password_123';

    try {
        console.log(`1. Creating temp admin: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                role: 'admin' // Ensure role is set if needed
            }
        });

        console.log('2. Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token.');

        console.log('3. Calling refresh endpoint...');
        const res = await fetch('http://localhost:5000/api/settings/refresh-rental-rate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status:', res.status);
        const data = await res.json();

        console.log('Body Type:', typeof data);
        console.log('Body Data:', JSON.stringify(data, null, 2));

        if (data && Array.isArray(data.data)) {
            console.log('VALIDATION SUCCESS: res.data.data is an array.');
        } else {
            console.log('VALIDATION FAILED: res.data.data is NOT an array.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
