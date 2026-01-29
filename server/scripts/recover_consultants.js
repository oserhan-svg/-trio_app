const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function recoverConsultants() {
    console.log('🔍 Starting Consultant Recovery...');

    try {
        // 1. Get all unique sellerNames from properties (office listings)
        const officeListings = await prisma.property.findMany({
            where: {
                seller_type: {
                    in: ['office', 'store'] // Adjust based on your schema usage
                }
            },
            select: {
                seller_name: true
            },
            distinct: ['seller_name']
        });

        const distinctNames = officeListings
            .map(p => p.seller_name)
            .filter(name => name && name.toLowerCase().includes('trio'));

        console.log(`📊 Found ${distinctNames.length} distinct consultant names in listings:`);
        console.log(distinctNames.join(', '));

        // 2. Get existing users
        const existingUsers = await prisma.user.findMany();
        const existingNames = new Set(existingUsers.map(u => u.name));
        const existingEmails = new Set(existingUsers.map(u => u.email));

        // 3. Identification and Restoration
        let restoredCount = 0;
        const passwordHash = await bcrypt.hash('123456', 10);

        for (const name of distinctNames) {
            if (!existingNames.has(name)) {
                // Generate email
                const slug = name.toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '.')
                    .replace(/\.+/g, '.');

                const email = `${slug}@trioemlak.com`;

                if (existingEmails.has(email)) {
                    console.log(`⚠️ Email collision for ${name} (${email}), skipping auto-create.`);
                    continue;
                }

                console.log(`✨ Restoring: ${name} -> ${email}`);

                await prisma.user.create({
                    data: {
                        name: name,
                        email: email,
                        password_hash: passwordHash,
                        role: 'consultant'
                    }
                });
                restoredCount++;
            }
        }

        console.log(`✅ Recovery Complete! Restored ${restoredCount} users.`);

    } catch (error) {
        console.error('❌ Recovery Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recoverConsultants();
