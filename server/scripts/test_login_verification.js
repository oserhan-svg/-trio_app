const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function testLogin() {
    console.log('🔍 Testing Login for admin@emlak22.com...');
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@emlak22.com' }
        });

        if (!user) {
            console.error('❌ User NOT found in DB!');
            return;
        }
        console.log('✅ User found in DB.');
        console.log('Stored Hash:', user.password_hash);

        const isMatch = await bcrypt.compare('admin123', user.password_hash);
        console.log('🔑 Password "admin123" match result:', isMatch);

        if (isMatch) {
            console.log('✅ LOGIN SHOULD SUCCESS (Logic is correct)');
        } else {
            console.error('❌ PASSWORD MISMATCH (Hash invalid?)');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
