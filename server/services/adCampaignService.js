const prisma = require('../db');
const groqService = require('./GroqService');

class AdCampaignService {

    /**
     * Generate complete ad copy sets for Facebook, Instagram, and Google
     */
    async generateAdAssets(propertyId) {
        console.log(`📣 Architecting Ad Campaign for Property #${propertyId}`);

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) throw new Error('Property not found');

        const prompt = `
        Sen Trio Emlak'ın Kıdemli Dijital Pazarlama Stratejistisin. 
        Aşağıdaki ilan için yüksek dönüşümlü (high-conversion) reklam metinleri hazırla.

        İLAN: ${property.title}
        BÖLGE: ${property.district} / ${property.neighborhood}
        ÖZELLİKLER: ${property.features.slice(0, 5).join(', ')}
        FİYAT: ${property.price} TL

        GÖREV:
        1. FACEBOOK/INSTAGRAM: Uzun ve hikaye anlatan bir metin (Storytelling).
        2. GOOGLE SEARCH ADS: 3 adet başlık (max 30 karakter) ve 2 adet açıklama (max 90 karakter).
        3. INSTAGRAM REELS/TIKTOK: Video senaryosu için 3 saniyelik "Hook" cümlesi.
        4. HEDEFLEME: Bu ilan için en doğru 5 anahtar kelime/interest (Örn: "Ayvalık butik otel", "Cunda yatırım").

        TON: Enerjik, merak uyandıran ve profesyonel.
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8
        });

        const rawResult = response.choices[0].message.content;

        return {
            propertyId: property.id,
            assets: rawResult,
            suggestedKeywords: this.extractKeywords(rawResult),
            generatedAt: new Date()
        };
    }

    extractKeywords(text) {
        // Simplified keyword extraction from AI response (mock)
        return ['Ayvalık Yatırım', 'Cunda Satılık', 'Aegean Real Estate', 'Yazlık Fırsatı'];
    }
}

module.exports = new AdCampaignService();
