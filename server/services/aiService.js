const path = require('path');
const fs = require('fs');

const getCompanyConfig = () => {
    try {
        const configPath = path.join(__dirname, '../config/companyConfig.json');
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.warn('Company config not found or invalid');
        return {};
    }
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generatePropertyDescription = async (property) => {
    // This runs locally without any API cost
    const company = getCompanyConfig();
    const price = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(property.price);
    const m2 = property.size_m2 ? `${property.size_m2} m²` : '';
    const location = [property.neighborhood, property.district].filter(Boolean).join(', ');
    const rooms = property.rooms || '';

    // 1. Hook (Dikkat Çekici Giriş)
    const hooks = [
        `Hayallerinizdeki yaşama ${location} bölgesinde adım atın!`,
        `${location} konumunda, fırsat niteliğinde satılık daire!`,
        `Yatırım ve oturum için kaçırılmayacak fırsat: ${location} bölgesinde lüks yaşam sizi bekliyor.`,
        `Trio Emlak ayrıcalığıyla sunulan bu özel portföyü keşfedin.`,
        `${location}'de, konfor ve prestiji bir arada arayanlar için...`
    ];

    // 2. Body (Gelişme - Detaylar)
    const bodyTemplates = [
        `Bu muazzam daire, ${rooms} oda sayısı ve ${m2} geniş kullanım alanıyla ferah bir atmosfer sunuyor. Modern mimarisi ve kullanışlı planıyla aileniz için ideal bir yaşam alanı yaratıyor.`,
        `${rooms} planına sahip mülkümüz, ${m2} kullanım alanı ile ihtiyaç duyduğunuz tüm konforu sağlıyor. Gün boyu ışık alan cephesi ve ferah odalarıyla yaşam kalitenizi yükseltmeye hazır.`,
        `Tam ${m2} büyüklüğündeki bu ${rooms} daire, bölgenin en prestijli konumlarından birinde yer alıyor. Hem bugününüz hem de geleceğiniz için sağlam bir yatırım.`
    ];

    // 3. Features Highlight (Özellik Vurgusu)
    let featureText = "";
    if (property.features && property.features.length > 0) {
        // Filter unnecessary technical terms
        const readableFeatures = property.features.filter(f => !f.match(/ilan no|tarih|güncel/i)).slice(0, 5);
        if (readableFeatures.length > 0) {
            featureText = `\n\nÖne Çıkan Özellikler:\n` + readableFeatures.map(f => `✨ ${f}`).join('\n');
        }
    }

    // 4. Call to Action (Harekete Geçirici Mesaj)
    const callToActions = [
        `Bu özel fırsatı kaçırmamak ve detaylı bilgi almak için hemen bizimle iletişime geçin.`,
        `Yeni eviniz sizi bekliyor. Randevu oluşturmak için profesyonel ekibimizi arayın.`,
        `Bölgenin uzmanı Trio Emlak güvencesiyle bu mülkü yerinde görmek için arayın.`
    ];

    // Assemble the text
    const hook = getRandom(hooks);
    const body = getRandom(bodyTemplates);
    const cta = getRandom(callToActions);

    const description = `${hook}\n\n${body}${featureText}\n\n${cta}\n\n📞 İletişim & Randevu:\n${company.companyName || 'Trio Emlak'}\n${company.companyPhone || ''}\n${company.companyPhone2 ? company.companyPhone2 + '\n' : ''}${company.companyWebsite || ''}`;

    // Simulate async delay to feel like "processing" (optional, for UX consistency)
    await new Promise(resolve => setTimeout(resolve, 800));

    // 5. Title Generation (Özel Başlık)
    const titleTemplates = [
        `${location} - ${rooms} - Fırsat Daire`,
        `${location}'de Satılık Lüks ${rooms}`,
        `${company.companyName} Farkıyla: ${location} ${rooms}`,
        `Yatırımlık Fırsat: ${location} ${rooms} Daire`,
        `${location}'de Hayallerinizdeki ${rooms}`
    ];

    // Choose specific title logic if needed, or random
    const title = getRandom(titleTemplates);

    return {
        title: title,
        description: description
    };
};

module.exports = { generatePropertyDescription };
