const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');

class PropertyRefiner {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    /**
     * Refines property data: Fixes titles, creates summaries, and extracts tags.
     */
    async refineProperty(propertyId) {
        try {
            const property = await prisma.property.findUnique({
                where: { id: propertyId }
            });

            if (!property || !this.groq) return null;

            // Only refine if it's nameless or lacks a good description
            const isGenericTitle = !property.title ||
                property.title === 'İsimsiz İlan' ||
                property.title.length < 10 ||
                /^\d+.*m2/i.test(property.title);

            if (!isGenericTitle && property.ai_summary) {
                return property; // Already refined enough
            }

            console.log(`🪄 Refining property #${propertyId}: ${property.title}`);

            const prompt = `
                AŞAĞIDAKİ EMLAK İLANINI ANALİZ ET:
                Mevcut Başlık: ${property.title}
                Açıklama: ${property.description || 'Açıklama yok'}
                Konum: ${property.district} / ${property.neighborhood}
                Fiyat: ${property.price} TL
                Özellikler: ${property.rooms}, ${property.size_m2} m2, ${property.listing_type}
                
                GÖREVİN:
                1. İlan için ilgi çekici, profesyonel ama yanıltıcı olmayan bir BAŞLIK oluştur.
                2. İlan için 1-2 cümlelik "AKILLI ÖZET" çıkar (Müşteriye neden hitap ettiğini vurgula).
                3. İlandaki özelliklerden 3-5 adet teknik ETİKET çıkar (örn: deniz_manzaralı, bahçeli, yatırımlık).
                
                JSON FORMATI:
                {
                    "title": "Yeni Başlık",
                    "ai_summary": "Akıllı Özet Metni",
                    "tags": ["etiket1", "etiket2"]
                }
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen profesyonel bir emlak editörü ve veri uzmanısın. Sadece JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const refined = JSON.parse(completion.choices[0].message.content);

            const updated = await prisma.property.update({
                where: { id: propertyId },
                data: {
                    title: refined.title || property.title,
                    ai_summary: refined.ai_summary,
                    metadata: {
                        ...(typeof property.metadata === 'object' ? property.metadata : {}),
                        ai_refined: true,
                        ai_tags: refined.tags
                    }
                }
            });

            return updated;
        } catch (error) {
            console.error(`Refinement Error for Property #${propertyId}:`, error);
            return null;
        }
    }

    /**
     * Batch refine properties with nameless titles
     */
    async batchRefine(limit = 10) {
        const namelessProps = await prisma.property.findMany({
            where: {
                OR: [
                    { title: 'İsimsiz İlan' },
                    { title: { startsWith: '[İsimsiz]' } },
                    { title: { length: { lt: 10 } } }
                ]
            },
            take: limit
        });

        console.log(`🚀 Starting batch refinement for ${namelessProps.length} properties...`);
        for (const prop of namelessProps) {
            await this.refineProperty(prop.id);
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

module.exports = new PropertyRefiner();
