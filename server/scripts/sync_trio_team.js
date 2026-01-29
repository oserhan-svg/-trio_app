const { scrapeSahibindenTeam } = require('../services/stealthScraper');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Latinize helper for email generation
function latinize(str) {
    const map = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        // 'i': 'i', // i is already i, but careful with I->i lowercasing
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, match => map[match]);
}

async function syncTeam() {
    const url = 'https://trioemlakvegayrimenkul.sahibinden.com/ekibimiz';
    console.log(`🚀 Starting Consultant Sync from: ${url}`);

    try {
        // 1. Scrape Data
        const members = await scrapeSahibindenTeam(url);
        console.log(`📋 Found ${members.length} consultants.`);

        const defaultPasswordHash = await bcrypt.hash('123456', 10);

        for (const member of members) {
            const { name, phone, img } = member;
            if (!name) continue;

            console.log(`👉 Processing: ${name}`);

            // Remove non-digits from phone for better matching
            // Example: "0 (533) 378 68 94" -> "05333786894"
            const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
            // Also a version without leading 0 for looser matching? 
            // Usually we store with 0 or +90. Let's assume standard format for now.
            // But let's check if the generic search finds it.

            // Generate Email
            // "Ozancan Serhan" -> "ozancan.serhan@trio.com"
            const latinName = latinize(name.toLowerCase());
            const emailParts = latinName.split(/\s+/);
            const generatedEmail = `${emailParts[0]}.${emailParts[emailParts.length - 1]}@trio.com`;

            // 2. Find Existing User
            let existingUser = null;

            // Try by Phone (if valid)
            if (cleanPhone && cleanPhone.length > 9) {
                // Try fuzzy phone match if possible? Or verify exact format in DB.
                // Our DB `User` doesn't enforce unique phone, so findFirst.
                // We'll search by containing the last 7 digits to be safe? 
                // "findFirst" with "contains" on phone string might be safer if formats vary.
                // But Prisma verify string contains:
                // Let's try direct first.

                // Let's assume stored phones might be formatted or raw.
                // We'll try to match exact first.
                // Actually, let's prioritize Name match if phone fails, or Email.
            }

            // Strategy: 
            // 1. Check by Generated Email (most stable ID we are creating)
            // 2. Check by Name (Exact match)
            // 3. Check by Phone (Not reliable format)

            existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: generatedEmail },
                        { name: { equals: name, mode: 'insensitive' } },
                        // Phone matching is tricky without normalization.
                        // We skip it for finding user to avoid false positives/negatives for now,
                        // unless we are sure.
                    ]
                }
            });

            // 3. Upsert Logic
            if (existingUser) {
                console.log(`   🔄 Updating existing user (ID: ${existingUser.id})...`);
                // Update photo if missing or different? 
                // Always update photo from source? Yes.
                // Update phone if valid in source and different?

                const updateData = {
                    profile_picture: img || existingUser.profile_picture,
                    name: name || existingUser.name // Trigger name update
                };

                if (cleanPhone && (!existingUser.phone || existingUser.phone.length < 10)) {
                    updateData.phone = phone; // Store the formatted one or cleaned one? 
                    // Let's store the scraped format "0 (533)..." it looks nice.
                }

                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: updateData
                });
                console.log(`   ✅ Updated.`);

            } else {
                console.log(`   ✨ Creating new user...`);
                // Create
                await prisma.user.create({
                    data: {
                        name: name,
                        email: generatedEmail,
                        phone: phone, // scraped format
                        profile_picture: img,
                        password_hash: defaultPasswordHash,
                        role: 'consultant'
                    }
                });
                console.log(`   ✅ Created (${generatedEmail}).`);
            }
        }

        console.log('🏁 Sync Completed Successfully.');

    } catch (e) {
        console.error('❌ Sync Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

syncTeam();
