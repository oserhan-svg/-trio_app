const prisma = require('../db');
const groqService = require('./GroqService');
const matchingService = require('./matchingService');

class LeadRevivalService {

    /**
     * Identify high-potential dormant leads and find a "reason to call/text"
     */
    async findRevivalOpportunities() {
        console.log('⛏️ Mining for dormant opportunities...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Find leads with no activity for >30 days but with high historical priority
        const dormantLeads = await prisma.client.findMany({
            where: {
                last_ai_interaction: { lte: thirtyDaysAgo },
                status: { in: ['New', 'Active', 'Negotiation'] },
                priority_score: { gte: 40 } // Only mining relatively serious leads
            },
            include: {
                demands: true,
                interactions: { take: 5, orderBy: { date: 'desc' } }
            }
        });

        const opportunities = [];

        for (const client of dormantLeads) {
            // 2. Find new properties that match these dormant demands
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const newMatches = await prisma.property.findMany({
                where: {
                    created_at: { gte: sevenDaysAgo },
                    status: 'active'
                }
            });

            const bestMatches = [];
            for (const prop of newMatches) {
                for (const demand of client.demands) {
                    const { score, isViable } = matchingService.calculateMatchScore(prop, demand, client.ai_summary);
                    if (isViable && score > 75) {
                        bestMatches.push({ prop, score });
                    }
                }
            }

            if (bestMatches.length > 0) {
                // Sort by score and pick the best one
                bestMatches.sort((a, b) => b.score - a.score);
                const winningMatch = bestMatches[0];

                // 3. Generate a "Revival Hook" using AI
                const hook = await this.generateRevivalHook(client, winningMatch.prop);

                opportunities.push({
                    clientId: client.id,
                    clientName: client.name,
                    propertyId: winningMatch.prop.id,
                    propertyTitle: winningMatch.prop.title,
                    matchScore: winningMatch.score,
                    revivalHook: hook,
                    lastInteraction: client.last_ai_interaction
                });
            }
        }

        return opportunities.sort((a, b) => b.matchScore - a.matchScore);
    }

    async generateRevivalHook(client, property) {
        const prompt = `
        Sen Trio Emlak'ın Kıdemli Satış Stratejistisin. 
        Aşağıdaki "SOĞUMUŞ" müşteriyi, elindeki YENİ ve ÇOK UYGUN bir ilanla tekrar canlandırman (Revival) gerekiyor.

        MÜŞTERİ: ${client.name}
        SON ETKİLEŞİM: ${client.last_ai_interaction}
        MÜŞTERİ ÖZETİ: ${JSON.stringify(client.ai_summary)}

        YENİ İLAN:
        Başlık: ${property.title}
        Fiyat: ${property.price} TL
        Konum: ${property.district} / ${property.neighborhood}
        Özellikler: ${property.features.join(', ')}

        GÖREV:
        Müşteriye samimi, profesyonel ve "Bunu senin için özel olarak bekletiyordum" hissi veren bir WhatsApp "Canlandırma" mesajı taslağı hazırla.
        - Müşterinin eski taleplerine atıfta bulun.
        - İlanın neden bir "fırsat" olduğunu (konum, fiyat, özellik) vurgula.
        - Tek cümlelik, net bir soruyla bitir.

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

module.exports = new LeadRevivalService();
