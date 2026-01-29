require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    console.log('--- Testing User Update Logic ---');
    try {
        // 1. Find a target user (e.g., one of the new consultants)
        const user = await prisma.user.findFirst({
            where: { email: { endsWith: '@trio.com' } }
        });

        if (!user) {
            console.log('No test user found.');
            return;
        }

        console.log(`Target User: ${user.name} (${user.email}) [ID: ${user.id}]`);

        // 2. Simulate Payload
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: "Updated Name Test",
            // password: "" // Empty password in frontend
        };

        // 3. Simulate Controller Logic
        const updateData = {
            email: payload.email,
            role: payload.role,
            name: payload.name
        };

        // Password logic simulation
        if (payload.password) {
            // hash
        }

        console.log('Update Data:', updateData);

        // 4. Perform Update
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: { id: true, email: true, name: true, role: true }
        });

        console.log('Updated Result:', updatedUser);

        // 5. Verify Persistence
        const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
        console.log('Fresh Fetch:', freshUser.name);

        // Revert changes
        await prisma.user.update({
            where: { id: user.id },
            data: { name: user.name }
        });
        console.log('Reverted changes.');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdate();
