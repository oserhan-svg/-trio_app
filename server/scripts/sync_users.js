const prisma = require('../db');
const fs = require('fs');
const path = require('path');

async function syncUsers() {
    const isLive = process.env.DATABASE_URL.includes('supabase');
    console.log(`🚀 Mode: ${isLive ? 'LIVE (Import)' : 'LOCAL (Export)'}`);

    if (!isLive) {
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
