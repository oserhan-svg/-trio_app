const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function syncUsers() {
    const mode = process.argv[2]; // 'export' or 'import'

    if (!mode || !['export', 'import'].includes(mode)) {
        console.error('❌ Kullanım: node sync_users.js [export|import]');
        process.exit(1);
    }

    const isExport = mode === 'export';
    // Decide URL based on mode
    const url = isExport
        ? (process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL)
        : (process.env.LIVE_DATABASE_URL || process.env.DATABASE_URL);

    console.log(`🚀 Mode: ${mode.toUpperCase()}`);
    if (isExport) {
        if (!process.env.LOCAL_DATABASE_URL) console.log('ℹ️  Using default DATABASE_URL for export.');
        else console.log('💻 Using LOCAL_DATABASE_URL for export.');
    } else {
        if (!process.env.LIVE_DATABASE_URL) console.warn('⚠️  Using default DATABASE_URL for import (LIVE_DATABASE_URL missing).');
        else console.log('🌍 Using LIVE_DATABASE_URL for import.');
    }

    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });

    if (isExport) {
        // EXPORT MODE
        try {
            const users = await prisma.user.findMany();
            fs.writeFileSync(path.join(__dirname, '../temp_users.json'), JSON.stringify(users, null, 2));
            console.log(`✅ ${users.length} users exported from local.`);
        } catch (e) {
            console.error('Export failed:', e.message);
        }
    } else {
        // IMPORT MODE
        const dataPath = path.join(__dirname, '../temp_users.json');
        if (!fs.existsSync(dataPath)) return console.error('No temp_users.json found!');

        try {
            const users = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            for (const user of users) {
                const { id, ...data } = user;
                await prisma.user.upsert({
                    where: { email: data.email },
                    update: data,
                    create: data
                });
                console.log(`✅ User sync: ${data.email}`);
            }
            console.log('🏁 User sync completed.');
        } catch (e) {
            console.error('Import failed:', e.message);
        }
    }
    await prisma.$disconnect();
}

syncUsers();
