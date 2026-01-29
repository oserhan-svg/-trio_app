const Groq = require('groq-sdk');
const prisma = require('../db');

class MarketingService {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    /**
     * Generates a full marketing package (Listing, Instagram, WhatsApp)
     */
    async generateMarketingPackage(propertyId) {
        try {
            const property = await prisma.property.findUnique({
                where: { id: propertyId }
            });

            if (!property || !this.groq) return null;

            console.log(`📣 Generating Marketing Package for Property #${propertyId}`);

            const prompt = `
                AŞAĞIDAKİ EMLAK İLANINI ANALİZ ET VE PAZARLAMA PAKETİ OLUŞTUR:
                Mevcut Başlık: ${property.title}
                Açıklama: ${property.description || 'Açıklama yok'}
                Konum: ${property.district} / ${property.neighborhood}
                Fiyat: ${property.price} TL
                Özellikler: ${property.rooms}, ${property.size_m2} m2, ${property.listing_type}
                
                GÖREVLERİN:
                1. PREMİUM İLAN METNİ: Web sitesi için akıcı, profesyonel ve davetkar bir metin.
                2. İNSTAGRAM PAKETİ: İlgi çekici bir açıklama (Caption) ve en az 10 adet popüler emlak hashtag'i.
                3. WHATSAPP PİTCH: Müşteriye özelden gönderilecek, kısa, madde işaretli ve hızlı özet geçen bir yazı.
                
                JSON FORMATI:
                {
                    "premium_title": "...",
                    "premium_description": "...",
                    "instagram": {
                        "caption": "...",
                        "hashtags": "#emlak #ayvalik ..."
                    },
                    "whatsapp_pitch": "..."
                }
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen profesyonel bir dijital emlak pazarlama uzmanısın. Sadece JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const packageData = JSON.parse(completion.choices[0].message.content);

            // Optional: Try to update property metadata if field exists (might fail if schema out of sync)
            try {
                await prisma.property.update({
                    where: { id: propertyId },
                    data: {
                        metadata: {
                            ...(typeof property.metadata === 'object' ? property.metadata : {}),
                            marketing_package: packageData,
                            marketing_generated_at: new Date().toISOString()
                        }
                    }
                });
            } catch (err) {
                console.warn(`Could not save marketing package to Property #${propertyId} metadata: ${err.message}`);
            }
            return packageData;
        } catch (error) {
            console.error(`Marketing Generation Error for Property #${propertyId}:`, error);
            return null;
        }
    }

    /**
     * Generates a data-backed appraisal pitch for owners or buyers
     */
    async generateAppraisalPitch(propertyId, twinsData) {
        try {
            const property = await prisma.property.findUnique({
                where: { id: propertyId }
            });

            if (!property || !this.groq) return null;

            const { market, target } = twinsData;

            const prompt = `
                SEN: Veri odaklı bir Gayrimenkul Değerleme Uzmanısısın.
                GÖREV: Aşağıdaki pazar verilerini kullanarak mülk sahibi için profesyonel bir "Fiyatlandırma Raporu ve İkna Mesajı" hazırla.
                
                MÜLK: ${property.title}
                KONUM: ${property.neighborhood}, ${property.district}
                MEVCUT FİYAT: ${target.price} TL (${Math.round(target.price_per_m2)} TL/m2)
                
                PAZAR VERİSİ:
                - Bölgedeki Benzer İlan Sayısı: ${market.sample_size}
                - Bölge m² Ortalama Fiyatı: ${Math.round(market.avg_price_per_m2)} TL
                - Sapma: ${market.deviation > 0 ? 'Piyasanın %' + market.deviation + ' üstünde' : 'Piyasanın %' + Math.abs(market.deviation) + ' altında'}
                
                TALİMATLAR:
                1. ANALİZ: Mülkün fiyatını piyasa ortalamasıyla teknik olarak kıyasla.
                2. STRATEJİ: Danışmana bu mülkü nasıl pazarlaması gerektiğini veya mülk sahibini nasıl yönlendirmesi gerektiğini söyle.
                3. WHATSAPP MESAJI: Mülk sahibine gönderilecek, veriye dayalı, nazik ama ikna edici bir bilgilendirme mesajı.
                
                JSON FORMATI:
                {
                    "market_analysis": "...",
                    "consultant_strategy": "...",
                    "owner_message": "..."
                }
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen uzman bir emlak analistisin. Sadece JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error(`Appraisal Pitch Error for Property #${propertyId}:`, error);
            return null;
        }
    }
}

module.exports = new MarketingService();
