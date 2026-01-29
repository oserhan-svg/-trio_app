const prisma = require('../db');
const groqService = require('./GroqService');

class CompetitorWarRoomService {

    /**
     * Identify listings from other offices that match or undercut our listings
     */
    async analyzeCompetitors(propertyId) {
        console.log(`📡 Scan initiated: Competitor War Room for Property #${propertyId}`);

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) },
            include: { history: true }
        });

        if (!property) throw new Error('Property not found');

        // 1. Find directly competing listings (Same neighborhood, same rooms, +-15% size)
        const minSize = property.size_m2 ? parseFloat(property.size_m2) * 0.85 : 0;
        const maxSize = property.size_m2 ? parseFloat(property.size_m2) * 1.15 : 9999;

        const competitors = await prisma.property.findMany({
            where: {
                neighborhood: property.neighborhood,
                district: property.district,
                rooms: property.rooms,
                size_m2: { gte: minSize, lte: maxSize },
                status: 'active',
                seller_type: 'office', // Specifically looking for other agencies
                id: { not: property.id }
            },
            take: 5
        });

        // 2. Detect "Price Wars" (If any competitor is lower than us)
        const myPrice = parseFloat(property.price);
        const threats = competitors.filter(c => parseFloat(c.price) < myPrice);

        // 3. AI Strategy Recommender
        const strategy = await this.recommendStrategy(property, competitors, threats);

        return {
            propertyId: property.id,
            propertyTitle: property.title,
            myPrice,
            competitorCount: competitors.length,
            threatCount: threats.length,
            competitors: competitors.map(c => ({
                id: c.id,
                title: c.title,
                price: parseFloat(c.price),
                diff: ((parseFloat(c.price) - myPrice) / myPrice * 100).toFixed(1),
                url: c.url
            })),
            strategy
        };
    }

    async recommendStrategy(property, competitors, threats) {
        if (competitors.length === 0) {
            return {
                type: 'MONOPOLY',
                label: 'Pazara Hakim',
                recommendation: 'Bu özelliklerde bölgedeki tek aktif ilan sizinkisi. Fiyatı koruyun, hatta %5 premium artış değerlendirilebilir.',
                urgency: 'low'
            };
        }

        const prompt = `
        Sen Trio Emlak'ın Stratejik Fiyatlandırma Müdürüsün. 
        Aşağıdaki ilanımız için rakiplerle bir "Fiyat Savaşı" (Price War) analizi yapman gerekiyor.

        BİZİM İLANIMIZ:
        Başlık: ${property.title}
        Fiyat: ${property.price} TL
        Konum: ${property.district} / ${property.neighborhood}

        RAKİP İLANLAR (${competitors.length} adet):
        ${competitors.map(c => `- ${c.title}: ${c.price} TL (${c.url})`).join('\n')}

        TEHDİT ANALİZİ:
        - Bizden daha ucuz olan ilan sayısı: ${threats.length}

        GÖREV:
        Şu stratejilerden birini seç: [MATCH, UNDERCUT, HOLD, PREMIUM]
        - MATCH: Rakiple aynı fiyata in.
        - UNDERCUT: Rakibin %2 altına inerek liderliği al.
        - HOLD: İlanın kalitesi daha yüksek, fiyatı düşürme.
        - PREMIUM: Rakipler çok kalitesiz kalıyor, fiyatı artır.

        JSON formatında şu değerleri döndür:
        {
            "type": "STRATEJI_KODU",
            "label": "Kısa Başlık",
            "recommendation": "Detaylı açıklama ve neden bu karar verildiği",
            "urgency": "low/medium/high",
            "targetPrice": sayı
        }
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    }
}

module.exports = new CompetitorWarRoomService();
