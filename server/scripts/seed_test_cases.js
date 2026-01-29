const prisma = require('../db');

const REAL_WORLD_TESTS = [
    {
        input_message: "Ayvalık'ta deniz manzaralı 3+1 satılık daire var mı?",
        expected_intent: "searchProperties",
        expected_keywords: ["ayvalık", "3+1", "satılık"],
        category: "real_estate"
    },
    {
        input_message: "Cunda adasında kiralık villa fiyatları ne kadar?",
        expected_intent: "searchProperties",
        expected_keywords: ["cunda", "kiralık", "villa"],
        category: "real_estate"
    },
    {
        input_message: "Tapu masrafları alıcıya mı aittir?",
        expected_intent: "searchWeb", // Or knowledge retrieval if in DB, but usually general knowledge
        expected_keywords: [],
        category: "general_knowledge"
    },
    {
        input_message: "Kredi faiz oranları şu an yüzde kaç?",
        expected_intent: "searchWeb",
        expected_keywords: ["faiz", "kredi"],
        category: "finance"
    },
    {
        input_message: "Yarın saat 14:00'te Ahmet Bey ile randevu oluştur.",
        expected_intent: "createCalendarEvent",
        expected_keywords: ["14:00", "Ahmet Bey", "randevu"],
        category: "productivity"
    }
];

async function seedTestCases() {
    console.log("Seeding Real World Test Cases...");

    for (const test of REAL_WORLD_TESTS) {
        const existing = await prisma.aITestCase.findFirst({
            where: { input_message: test.input_message }
        });

        if (!existing) {
            await prisma.aITestCase.create({
                data: {
                    input_message: test.input_message,
                    expected_intent: test.expected_intent,
                    expected_keywords: test.expected_keywords,
                    category: test.category,
                    is_golden: true
                }
            });
            console.log(`+ Added: ${test.input_message.substring(0, 30)}...`);
        } else {
            console.log(`* Skipped (Exists): ${test.input_message.substring(0, 30)}...`);
        }
    }
    console.log("Seeding Complete.");
}

seedTestCases()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
