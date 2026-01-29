const prisma = require('../db');

async function seedTestCases() {
    console.log('Seeding AI Golden Test Cases...');

    const testCases = [
        {
            input_message: "Acil satılık 3+1 daire arıyorum Ayvalık merkezde, bütçem 5M TL.",
            expected_intent: "searchProperties",
            expected_keywords: ["acil", "3+1", "ayvalık", "5m"],
            category: "property_search"
        },
        {
            input_message: "Cunda adasında kiralık villa var mı? Haftaya görmeye gelmek istiyoruz.",
            expected_intent: "searchProperties",
            expected_keywords: ["cunda", "kiralık", "villa"],
            category: "property_search"
        },
        {
            input_message: "Yarın saat 10:00 için bir müşteri randevusu oluşturur musun? Ahmet Yılmaz ile 2. etap daire sunumu.",
            expected_intent: "createCalendarEvent",
            expected_keywords: ["randevu", "ahmet yılmaz", "10:00"],
            category: "calendar"
        },
        {
            input_message: "Ayvalık belediyesi yeni imar planı hakkında ne biliyorsun?",
            expected_intent: "searchWeb",
            expected_keywords: ["imar", "belediye"],
            category: "qa"
        }
    ];

    for (const tc of testCases) {
        await prisma.aITestCase.upsert({
            where: { id: 0 }, // This is a dummy where since we don't have unique constraint on message yet, but we'll use create if not exists logic
            update: {},
            create: tc
        });
    }

    console.log('Seed completed successfully.');
}

if (require.main === module) {
    seedTestCases().catch(console.error);
}

module.exports = seedTestCases;
