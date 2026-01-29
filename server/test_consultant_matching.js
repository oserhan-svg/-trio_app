require('dotenv').config();
const { findOrCreateConsultant } = require('./services/scraperService');
const prisma = require('./db');

async function verifyMatching() {
    console.log('Testing Matching Logic for Kubat Kanat...');

    // Simulate data coming from Scraper
    // Note: Scraper found "Kanat Kubat"
    const scrapedName = 'Kanat Kubat';
    const scrapedPhone = '0 (552) 473 10 21';
    const scrapedImg = 'https://image5.sahibinden.com/test.png';

    try {
        console.log(`Input: Name="${scrapedName}", Phone="${scrapedPhone}"`);
        const id = await findOrCreateConsultant(scrapedName, scrapedPhone, scrapedImg);

        console.log(`Returned ID: ${id}`);

        const user = await prisma.user.findUnique({ where: { id } });
        console.log('Matched User:', user);

        if (user.id === 68) {
            console.log('✅ SUCCESS: Matched incorrectly named scraper data to correct User 68 via Phone!');
        } else {
            console.log('❌ FAILURE: Created new user or matched wrong user');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyMatching();
