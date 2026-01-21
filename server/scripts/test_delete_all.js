const prisma = require('../db');

const bcrypt = require('bcryptjs'); // Need bcrypt to hash password

async function testDeleteAll() {
    let createdUserId = null;
    try {
        // 1. Create Temp Admin
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'testadmin@example.com',
                password_hash: hashedPassword,
                role: 'admin'
            }
        });
        createdUserId = user.id;
        console.log('Created Temp Admin:', user.email);

        // 2. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testadmin@example.com', password: 'password123' })
        });

        if (loginRes.status !== 200) {
            console.log('Login failed:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got Token');

        // 3. Delete for Arzu (ID 4)
        const clientId = 4;
        console.log(`Deleting for Client ${clientId}...`);

        const deleteRes = await fetch(`http://localhost:5000/api/clients/${clientId}/properties`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Delete Status:', deleteRes.status);
        const text = await deleteRes.text();
        console.log('Delete Body:', text);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (createdUserId) {
            await prisma.user.delete({ where: { id: createdUserId } });
            console.log('Cleaned up temp admin');
        }
        await prisma.$disconnect();
    }
}

testDeleteAll();
