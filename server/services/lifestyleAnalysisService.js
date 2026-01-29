const prisma = require('../db');
const groqService = require('./GroqService');

class LifestyleAnalysisService {

    /**
     * Analyze a property's location and generate a "Life Story"
     */
    async analyzeLifestyle(propertyId) {
        console.log(`🏠 Analyzing Lifestyle & Vibe for Property #${propertyId}`);

        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) }
        });

        if (!property) throw new Error('Property not found');

        // 1. Hyper-local Context (Hardcoded context for Ayvalık/Cunda regions)
        const neighborhoodVibes = {
            'Cunda': {
                vibe: 'Historical, High-end, Gastronomic',
                walkability: 'High - Pedestrian friendly streets',
                noise: 'Medium during peak season, Silent off-season',
                bestFor: 'Luxury lovers, Retired professionals, Foodies'
            },
            'Sarımsaklı': {
                vibe: 'Beach-focused, Touristy, Vibrant',
                walkability: 'Medium - Wide streets by the beach',
                noise: 'High during summer',
                bestFor: 'Families, Summer vacationers'
            },
            'Ayvalık Merkez': {
                vibe: 'Authentic, Historical, Commercial',
                walkability: 'High - Narrow traditional streets',
                noise: 'Vibrant but manageable',
                bestFor: 'Artists, Local culture enthusiasts'
            }
        };

        const context = neighborhoodVibes[property.district] || {
            vibe: 'Residential, Calm',
            walkability: 'Standard',
            noise: 'Low',
            bestFor: 'Families'
        };

        // 2. AI Lifestyle Storyteller
        const story = await this.generateLifestyleStory(property, context);

        return {
            propertyId: property.id,
            vibe: context.vibe,
            walkability: context.walkability,
            noiseLevel: context.noise,
            idealAudience: context.bestFor,
            narrative: story
        };
    }

    async generateLifestyleStory(property, context) {
        const prompt = `
        Sen Trio Emlak'ın Kıdemli Lokasyon Danışmanısın. 
        Aşağıdaki ilan için teknik verilerden uzak, bir "YAŞAM SENARYOSU" yazmanı istiyorum.

        İLAN: ${property.title}
        BÖLGE: ${property.district} / ${property.neighborhood}
        BÖLGE RUHU: ${context.vibe}
        KİMLER İÇİN UYGUN: ${context.bestFor}

        GÖREV:
        Müşterinin bu evde geçireceği bir günü tasvir eden 3 kısa paragraf yaz:
        1. Sabah: Evden çıktığında veya uyandığında göreceği manzara/hissiyat.
        2. Gün İçi: Civardaki olanaklar, yürüyüş mesafesindeki keyifler.
        3. Akşam: Lokasyonun gece ruhu ve huzuru.

        TON:
        - Romantik, davetkar ve hikaye anlatıcı.
        - Maddeler (Bullet points) kullanma, akıcı metin olsun.
        - Ayvalık/Cunda atmosferini hissettir.
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8
        });

        return response.choices[0].message.content.trim();
    }
}

module.exports = new LifestyleAnalysisService();
