/**
 * Test script for the free rule-based WhatsApp AI evaluation
 * Run with: node test_whatsapp_ai.js
 */

const { evaluateWhatsAppMessage } = require('./services/aiService');

async function runTests() {
    console.log('=== WhatsApp AI Evaluation Test Suite ===\n');

    const testCases = [
        {
            name: 'High Priority - Urgent Buy Request',
            message: 'Acil olarak Kadıköy\'de 3+1 daire arıyorum. Bütçem 5 milyon TL. Bu hafta içinde görüşebilir miyiz?',
            contactInfo: { name: 'Ahmet Yılmaz', phone: '5551234567' },
            expectedScore: '70+'
        },
        {
            name: 'Medium Priority - General Interest',
            message: 'Bakırköy\'de satılık daire portföyünüz var mı? 2+1 veya 3+1 arıyorum.',
            contactInfo: { name: 'Ayşe Demir', phone: '5559876543' },
            expectedScore: '50-69'
        },
        {
            name: 'Low Priority - Very Short Message',
            message: 'Merhaba',
            contactInfo: { name: 'Unknown', phone: '5551112233' },
            expectedScore: '<30'
        },
        {
            name: 'High Priority - Detailed Seller',
            message: 'Beşiktaş\'ta 150 m2 3+1 dairem var. Satmak istiyorum. Değerlendirme yapabilir misiniz?',
            contactInfo: { name: 'Mehmet Öz', phone: '5554445566' },
            expectedScore: '50+'
        },
        {
            name: 'Medium Priority - Rental Request',
            message: 'Şişli\'de kiralık ofis arıyorum. Yakında taşınmayı planlıyoruz.',
            contactInfo: { name: 'Zeynep Kaya', phone: '5557778899' },
            expectedScore: '40-60'
        },
        {
            name: 'Low Priority - Negative Response',
            message: 'Hayır gerek yok, ilgilenmiyorum.',
            contactInfo: { name: 'Ali Veli', phone: '5553334455' },
            expectedScore: '0'
        },
        {
            name: 'High Priority - Multiple Details',
            message: 'Merhaba, 4 milyon TL bütçeyle Maltepe\'de bahçeli müstakil ev bakıyorum. 4 oda olmalı, deniz manzaralı olursa süper olur. Bu ay içinde karar vereceğiz.',
            contactInfo: { name: 'Fatma Özkan', phone: '5556667788' },
            expectedScore: '70+'
        },
        {
            name: 'New - Summer House Request',
            message: 'Ayvalık Sarımsaklı tarafında yazlık bakıyorum. 3+1 müstakil olabilir.',
            contactInfo: { name: 'Canan Yaz', phone: '5551112244' },
            expectedScore: '50+'
        },
        {
            name: 'New - Commercial Inquiry',
            message: 'Kadıköy merkezde devren kiralık dükkan arayışımız var. Cafe için uygun olmalı.',
            contactInfo: { name: 'Burak İş', phone: '5553334499' },
            expectedScore: '60+'
        },
        {
            name: 'New Config - Regional Keyword',
            message: 'Anadolu Yakası tarafında 3+1 daire arıyoruz, metroya yakın olsun.',
            contactInfo: { name: 'Bölge Arayan', phone: '5559998877' },
            expectedScore: '50+'
        },
        {
            name: 'New Config - Jargon Test',
            message: 'Krediye uygun, iskanı alınmış 2+1 daire bakıyorum.',
            contactInfo: { name: 'Bilinçli Alıcı', phone: '5552223344' },
            expectedScore: '60+'
        },
        {
            name: "Phase 2 - Localized Term (Zeytinlik)",
            message: "Cunda tarafında yatırımlık zeytinlik bakıyoruz. Tapu müstakil mi?",
            contactInfo: { name: "Yatırımcı Ali", phone: "5552223344" },
            expectedScore: "70+"
        },
        {
            name: "Phase 2 - Localized Term (Kooperatif)",
            message: "Sarımsaklı'da kooperatif hissesi devreden var mı? Denize yakın olması önemli.",
            contactInfo: { name: "Hisse Arayan", phone: "5554443322" },
            expectedScore: "60+"
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log(`Message: "${testCase.message}"`);
        console.log(`Contact: ${testCase.contactInfo.name} (${testCase.contactInfo.phone})`);
        console.log(`Expected Score: ${testCase.expectedScore}`);

        const result = await evaluateWhatsAppMessage(
            testCase.message,
            testCase.contactInfo,
            []
        );

        console.log(`\n✅ Results:`);
        console.log(`   Lead Score: ${result.leadScore}/100`);
        console.log(`   Is Lead: ${result.isLead ? 'Yes' : 'No'}`);
        console.log(`   Intent: ${result.intent}`);
        console.log(`   Urgency: ${result.urgency}`);
        console.log(`   Suggested Action: ${result.suggestedAction}`);
        console.log(`   Recommendation: ${result.recommendation}`);
        console.log(`   Method: ${result.method}`);
        console.log('─'.repeat(80));
    }

    console.log('\n\n=== Conversation History Test ===\n');

    const conversationHistory = [
        { from: 'Client', content: 'Merhaba, Kadıköy\'de daire arıyorum' },
        { from: 'Consultant', content: 'Merhaba! Tabi, ne tür bir daire arıyorsunuz?' },
        { from: 'Client', content: '3+1, 5 milyon TL civarı' },
        { from: 'Consultant', content: 'Güzel, portföyümüze bakıp size dönüyorum' }
    ];

    const followupMessage = 'Bu hafta görüşebilir miyiz? Acil ihtiyacım var.';

    console.log('Conversation History (4 messages)');
    console.log('New Message:', followupMessage);

    const result = await evaluateWhatsAppMessage(
        followupMessage,
        { name: 'Engaged Client', phone: '5551234567' },
        conversationHistory
    );

    console.log(`\n✅ Results with Conversation Bonus:`);
    console.log(`   Lead Score: ${result.leadScore}/100 (includes +15 for ongoing conversation)`);
    console.log(`   Urgency: ${result.urgency}`);
    console.log(`   Recommendation: ${result.recommendation}`);

    console.log('\n\n🎉 All tests completed!\n');
}

runTests().catch(console.error);
