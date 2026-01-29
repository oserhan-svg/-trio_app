/**
 * AI Service Configuration
 * Centralized keywords, patterns, and constants for the rule-based AI engine.
 */

const intentKeywords = {
    buy: [
        'almak', 'alıyorum', 'satın almak', 'ev arıyorum', 'daire arıyorum',
        'arıyorum', 'arayışım', 'bulmak istiyorum', 'bakıyorum', 'ilgileniyorum',
        'düşünüyorum', 'bakmaktayım', 'ihtiyacım', 'ihtiyaç', 'talibim', 'niyetim var',
        'anlaştık', 'süper', 'uygun', 'arıyoruz', 'bakıyoruz', 'istiyoruz', 'düşünüyoruz', 'ilgileniyoruz',
        'zeytinlik', 'kooperatif', 'arsa', 'tarla', 'yatırımlık'
    ],
    sell: [
        'satmak', 'satıyorum', 'satılık', 'elden çıkarmak', 'değerlendirme',
        'fiyat öğrenmek', 'satış', 'ekspertiz', 'piyasa değeri'
    ],
    rent_in: [
        'kiralamak', 'kiralıyorum', 'kiralık ev', 'kiralık daire',
        'kirada oturmak', 'tutmak', 'kiralık arıyorum'
    ],
    rent_out: [
        'kiraya vermek', 'kiraya vereceğim', 'kiracı arıyorum', 'kira geliri'
    ],
    info: [
        'bilgi', 'detay', 'öğrenmek istiyorum', 'sormak istiyorum', 'danışmak',
        'sorum var', 'randevu', 'görüşmek', 'yer görme', 'sunum', 'konum', 'adres'
    ]
};

const propertyTypes = {
    residential: [
        'daire', 'ev', 'konut', 'rezidans', 'villa', 'müstakil', 'yalı',
        'yazlık', 'köy evi', 'bağ evi', 'taş ev', 'dublex', 'triplex', 'loft', 'studio'
    ],
    commercial: [
        'ofis', 'dükkan', 'işyeri', 'mağaza', 'ticari', 'plaza', 'büro',
        'devren', 'cafe', 'restoran', 'fabrika', 'depo', 'otel', 'pansiyon'
    ],
    land: [
        'arsa', 'tarla', 'bahçe', 'arazi', 'parsel', 'imarlı', 'zeytinlik', 'kooperatif', 'hisse'
    ]
};

const urgencyHigh = [
    'acil', 'hemen', 'bu hafta', 'bugün', 'yarın', 'bir an önce',
    'çok acele', 'hızlı', 'acilen', 'haftasonuna kadar', 'yarına kadar'
];

const urgencyMedium = [
    '2 hafta', 'bu ay', 'yakında', 'en kısa sürede', 'önümüzdeki ay',
    'süre içinde', 'yakın zamanda'
];

const locationIndicators = [
    'lokasyon', 'bölge', 'mahalle', 'cadde', 'sokak', 'yakın', 'merkez', 'civarı', 'tarafı',
    // Ayvalık
    'ayvalık', 'cunda', 'sarımsaklı', 'altınova', 'küçükköy', 'hayrettinpaşa',
    'ali çetinkaya', 'sefa', 'çamlık', 'lale adası', 'namık kemal', 'sakarya',
    'sahil', 'deniz tarafı', 'kazım karabekir',
    // Istanbul Keywords (General)
    'anadolu yakası', 'avrupa yakası', 'istanbul',
    // Istanbul Major Districts
    'kadıköy', 'beşiktaş', 'şişli', 'üsküdar', 'ataşehir', 'maltepe', 'pendik', 'kartal',
    'çekmeköy', 'sancaktepe', 'beykoz', 'ümraniye', 'sarıyer', 'bakırköy', 'bahçelievler',
    'beylikdüzü', 'esenyurt', 'başakşehir', 'küçükçekmece', 'büyükçekmece', 'kağıthane'
];

const detailIndicators = [
    'bütçe', 'tl', '₺', 'oda', 'm2', 'metrekare', 'kat', 'banyo', 'balkon', 'teras',
    'kredi', 'peşin', 'tapu', 'masraf', 'takas', 'fiyat', 'devren', 'stopaj', 'aidat',
    ' krediye uygun', 'iskan', 'kat mülkiyeti', 'ısıtma', 'kombili', 'doğalgaz', 'hisseli', 'müstakil tapu',
    'müstakil', 'bahçeli', 'deniz manzaralı', 'yatırımlık'
];

const positiveEngagement = [
    'teşekkür', 'sağolun', 'memnun oldum', 'güzel', 'harika', 'tamam',
    'olur', 'peki', 'anlaştık', 'süper', 'uygun'
];

const negativeEngagement = [
    'hayır', 'gerek yok', 'ilgilenmiyorum', 'spam', 'rahatsız etme',
    'istemiyorum', 'vazgeçtim', 'düşünmüyorum'
];

const scoringRules = {
    baseIntent: 30,
    infoIntent: 15,
    propertyType: 15,
    urgencyHigh: 25,
    urgencyMedium: 15,
    detailPerItem: 10,
    detailMax: 30,
    location: 10,
    positive: 5,
    negative: -50,
    lengthPenalty: -10, // < 20 chars
    lengthBonus: 10,    // > 100 chars
    historyBonus: 15,   // >= 3 messages
    highScoreThreshold: 70,
    mediumScoreThreshold: 50,
    lowScoreThreshold: 30
};

// Templates for Property Descriptions
const descriptionTemplates = {
    hooks: [
        `Hayallerinizdeki yaşama {location} bölgesinde adım atın!`,
        `{location} konumunda, fırsat niteliğinde satılık daire!`,
        `Yatırım ve oturum için kaçırılmayacak fırsat: {location} bölgesinde lüks yaşam sizi bekliyor.`,
        `Trio Emlak ayrıcalığıyla sunulan bu özel portföyü keşfedin.`,
        `{location}'de, konfor ve prestiji bir arada arayanlar için...`,
        `Eşsiz {location} manzarası ve konforuyla yeni yaşamınız sizi bekliyor.`
    ],
    bodies: [
        `Bu muazzam daire, {rooms} oda sayısı ve {m2} geniş kullanım alanıyla ferah bir atmosfer sunuyor. Modern mimarisi ve kullanışlı planıyla aileniz için ideal bir yaşam alanı yaratıyor.`,
        `{rooms} planına sahip mülkümüz, {m2} kullanım alanı ile ihtiyaç duyduğunuz tüm konforu sağlıyor. Gün boyu ışık alan cephesi ve ferah odalarıyla yaşam kalitenizi yükseltmeye hazır.`,
        `Tam {m2} büyüklüğündeki bu {rooms} daire, bölgenin en prestijli konumlarından birinde yer alıyor. Hem bugününüz hem de geleceğiniz için sağlam bir yatırım.`
    ],
    ctas: [
        `Bu özel fırsatı kaçırmamak ve detaylı bilgi almak için hemen bizimle iletişime geçin.`,
        `Yeni eviniz sizi bekliyor. Randevu oluşturmak için profesyonel ekibimizi arayın.`,
        `Bölgenin uzmanı Trio Emlak güvencesiyle bu mülkü yerinde görmek için arayın.`
    ],
    titles: [
        `{location} - {rooms} - Fırsat Daire`,
        `{location}'de Satılık Lüks {rooms}`,
        `{companyName} Farkıyla: {location} {rooms}`,
        `Yatırımlık Fırsat: {location} {rooms} Daire`,
        `{location}'de Hayallerinizdeki {rooms}`
    ]
};

module.exports = {
    intentKeywords,
    propertyTypes,
    urgencyHigh,
    urgencyMedium,
    locationIndicators,
    detailIndicators,
    positiveEngagement,
    negativeEngagement,
    scoringRules,
    descriptionTemplates
};
