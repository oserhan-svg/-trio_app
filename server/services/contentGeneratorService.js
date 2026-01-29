const prisma = require('../db');
const Groq = require('groq-sdk');

class ContentGeneratorService {
    constructor() {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    async generateMarketingContent(propertyId) {
        console.log(`🎨 Generating Marketing Content for Property #${propertyId}...`);

        try {
            // 1. Fetch Property Data with Context
            const property = await prisma.property.findUnique({
                where: { id: parseInt(propertyId) },
                include: {
                    history: true
                }
            });

            if (!property) throw new Error('Property not found');

            // 2. Generate Instagram Caption
            const igPrompt = `
Sosyal Medya Uzmanı olarak Trio Emlak için Instagram postu hazırla.
İlan Başlığı: ${property.title}
Fiyat: ${property.price} TL
Özellikler: ${property.features.join(', ')}
Bölge: ${property.district} / ${property.neighborhood}
Açıklama Özeti: ${property.description ? property.description.substring(0, 300) : ''}...

GÖREV:
- Dikkat çekici bir giriş cümlesi (Emoji ile).
- Evi betimleyen duygusal ve davetkar bir paragraf.
- Öne çıkan 3 özellik (Liste halinde).
- Harekete geçirici mesaj (Call to Action).
- 10 adet popüler emlak hashtagi.

TON:
- Samimi, profesyonel, Ayvalık/Cunda ruhunu yansıtan.
- Asla "robot" gibi durmasın.
            `;

            const igCompletion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: igPrompt }],
                temperature: 0.7
            });

            const instagramCaption = igCompletion.choices[0].message.content.trim();

            // 3. Generate Story Script (3 Frame)
            const storyPrompt = `
Bu ilan için Instagram Hikaye (Story) senaryosu yaz. 3 Karelik.
İlan: ${property.title} (${property.district})

FORMAT:
Kare 1: [Görsel Önerisi] - [Metin Overlay] - [Müzik Önerisi]
Kare 2: [Görsel Önerisi] - [Metin Overlay]
Kare 3: [Görsel Önerisi] - [Metin Overlay] + [Link Sticker]

Ton: Enerjik ve merak uyandırıcı.
            `;

            const storyCompletion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: storyPrompt }],
                temperature: 0.7
            });

            const storyScript = storyCompletion.choices[0].message.content.trim();

            // 4. Save to Database
            const result = {
                instagram: instagramCaption,
                story: storyScript,
                generated_at: new Date()
            };

            // Upsert PropertyListing if not exists, or update existing
            // Find existing listing first
            const existingListing = await prisma.propertyListing.findFirst({
                where: { property_id: parseInt(propertyId) }
            });

            if (existingListing) {
                await prisma.propertyListing.update({
                    where: { id: existingListing.id },
                    data: { marketing_content: result }
                });
            } else {
                // Create a basic listing entry if none exists yet
                await prisma.propertyListing.create({
                    data: {
                        property_id: parseInt(propertyId),
                        share_token: Math.random().toString(36).substring(7),
                        marketing_content: result
                    }
                });
            }

            console.log('✅ Marketing content saved.');
            return result;

        } catch (error) {
            console.error('Content Generation Error:', error);
            throw error;
        }
    }
}

module.exports = new ContentGeneratorService();
