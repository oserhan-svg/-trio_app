const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function testAddProperty() {
    let createdUserId = null;
    try {
        // 1. Create Temp Admin
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'testadmin_add@example.com',
                password_hash: hashedPassword,
                role: 'admin'
            }
        });
        createdUserId = user.id;
        console.log('Created Temp Admin:', user.email);

        // 2. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testadmin_add@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got Token');

        // 3. Add Property
        const clientId = 4; // Arzu

        // Find a valid property first
        const prop = await prisma.property.findFirst();
        if (!prop) {
            console.log('No properties in DB');
            return;
        }
        const propertyId = prop.id;

        console.log(`Adding Property ${propertyId} to Client ${clientId}...`);

        const res = await fetch(`http://localhost:5000/api/clients/${clientId}/properties`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                propertyId: propertyId,
                status: 'suggested'
            })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);

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

testAddProperty();
