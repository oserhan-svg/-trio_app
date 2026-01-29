const prisma = require('../db');
const groqService = require('./GroqService');
const matchingService = require('./matchingService');

class SalesActionService {

    /**
     * Finds the most urgent matches for a consultant's daily "To-Do" list
     */
    async generateDailySalesActions() {
        console.log('📈 Generating Proactive Sales Actions...');

        // 1. Get properties added or updated (price drop) in last 24h
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const freshAssets = await prisma.property.findMany({
            where: {
                OR: [
                    { created_at: { gte: yesterday } },
                    {
                        history: {
                            some: {
                                changed_at: { gte: yesterday },
                                change_type: 'price_decrease'
                            }
                        }
                    }
                ],
                status: 'active'
            }
        });

        // 2. Get active, high-priority clients
        const activeClients = await prisma.client.findMany({
            where: {
                status: { in: ['New', 'Active', 'Negotiation'] },
                priority_score: { gte: 50 }
            },
            include: {
                demands: true
            }
        });

        const actions = [];

        for (const property of freshAssets) {
            for (const client of activeClients) {
                for (const demand of client.demands) {
                    const { score, isViable } = matchingService.calculateMatchScore(property, demand, client.ai_summary);

                    if (isViable && score > 80) {
                        // 3. Generate hyper-personalized pitch
                        const pitch = await this.generatePitch(client, property, score);

                        actions.push({
                            clientId: client.id,
                            clientName: client.name,
                            propertyId: property.id,
                            propertyTitle: property.title,
                            matchScore: score,
                            pitch,
                            reason: property.created_at >= yesterday ? 'YENİ İLAN' : 'FİYAT DÜŞÜŞÜ'
                        });
                    }
                }
            }
        }

        // Return top 20 actions sorted by score
        return actions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
    }

    async generatePitch(client, property, score) {
        const prompt = `
        Sen Trio Emlak'ın Kıdemli Portföy Yöneticisisin. 
        Müşterin için MÜKEMMEL bir ev buldun veya evin fiyatı düştü. 
        Müşteriye bu özel haberi veren, "SATIŞ KAPATICI" bir WhatsApp mesajı hazırla.

        MÜŞTERİ: ${client.name}
        MÜŞTERİ ÖZETİ: ${JSON.stringify(client.ai_summary)}
        EŞLEŞME PUANI: %${score}

        İLAN: ${property.title}
        FİYAT: ${property.price} TL
        KONUM: ${property.district} / ${property.neighborhood}

        GÖREV:
        - Müşterinin tam olarak ne aradığını bildiğini hissettir.
        - Bu mülkün neden onun için "o ev" olduğunu açıkla.
        - Teknik terimlerden kaçın, "Yaşam Tarzı" (Lifestyle) vurgusu yap.
        - Yarın veya bugün için bir "Gezinti" (Showing) randevusu teklif et.

        Sadece mesaj metnini döndür.
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    }
}

module.exports = new SalesActionService();
