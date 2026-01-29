const prisma = require('../db');
const groqService = require('./GroqService');

class TranslationService {

    /**
     * Translate listing details to target language with cultural localization
     */
    async translateListing(propertyId, targetLang = 'EN') {
        console.log(`🌍 Localizing Property #${propertyId} to ${targetLang}`);

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) throw new Error('Property not found');

        const prompt = `
        Sen Trio Emlak'ın Global Satış Uzmanısın. 
        Aşağıdaki ilanı ${targetLang} diline yerelleştir (localise).

        BAŞLIK: ${property.title}
        AÇIKLAMA: ${property.description}
        ÖZELLİKLER: ${property.features.join(', ')}
        BÖLGE: ${property.district}

        GÖREV:
        1. Sadece çeviri yapma, yabancı yatırımcıyı cezbedecek bir dil kullan (Örn: "Cunda Island charm", "Aegean vibe").
        2. Bölgenin avantajlarını yabancı perspektifiyle vurgula (Havalimanına yakınlık, iklim, yatırım geri dönüşü).
        3. Metin profesyonel ve kurumsal olsun.

        DİL: ${targetLang === 'EN' ? 'English' : targetLang === 'DE' ? 'German' : 'Russian'}
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        return {
            propertyId: property.id,
            language: targetLang,
            translatedContent: response.choices[0].message.content.trim(),
            status: 'success'
        };
    }

    /**
     * Get currency rates (Simulated for demo, in production use external API)
     */
    async getCurrencyConversion(priceTL) {
        const rates = {
            USD: 30.2, // Mock rate
            EUR: 32.8,
            GBP: 38.4
        };

        return {
            TL: priceTL,
            USD: Math.round(priceTL / rates.USD),
            EUR: Math.round(priceTL / rates.EUR),
            GBP: Math.round(priceTL / rates.GBP)
        };
    }
}

module.exports = new TranslationService();
