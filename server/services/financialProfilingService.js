const prisma = require('../db');
const groqService = require('./GroqService');

class FinancialProfilingService {

    /**
     * Analyze a client's financial readiness and demand realism
     */
    async profileClient(clientId) {
        console.log(`💰 Profiling Finances for Client #${clientId}`);

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: { demands: true }
        });

        if (!client) throw new Error('Client not found');

        const demand = client.demands[0]; // Primary demand
        if (!demand) return { status: 'incomplete', message: 'No demands found for analysis.' };

        // 1. Market Data Context (Real-time average prices in selected district)
        const avgMarketPrice = await this.getAverageMarketPrice(demand.district, demand.rooms);

        // 2. Realism Calculation
        const budget = parseFloat(demand.max_price || 0);
        const realismScore = avgMarketPrice > 0 ? (budget / avgMarketPrice) * 100 : 100;

        // 3. AI Financial Outlook
        const analysis = await this.generateAIAnalysis(client, demand, avgMarketPrice, budget);

        return {
            clientId: client.id,
            maxBudget: budget,
            marketAvg: avgMarketPrice,
            realismScore: Math.min(100, Math.round(realismScore)),
            preQualificationStatus: realismScore >= 90 ? 'High' : realismScore >= 70 ? 'Medium' : 'Low',
            aiInsight: analysis
        };
    }

    async getAverageMarketPrice(district, rooms) {
        const stats = await prisma.property.aggregate({
            _avg: { price: true },
            where: {
                district: district,
                rooms: rooms,
                status: 'active'
            }
        });
        return stats._avg.price ? parseFloat(stats._avg.price) : 0;
    }

    async generateAIAnalysis(client, demand, marketAvg, budget) {
        const prompt = `
        Sen Trio Emlak'ın Kıdemli Satış Stratejistisin. 
        Müşterinin bütçesi ile piyasa gerçeklerini kıyasla.

        MÜŞTERİ: ${client.name}
        TALEBİ: ${demand.district} bölgesinde ${demand.rooms} oda
        MÜŞTERİ BÜTÇESİ: ${budget.toLocaleString('tr-TR')} TL
        BÖLGEDEKİ PİYASA ORTALAMASI: ${marketAvg.toLocaleString('tr-TR')} TL

        GÖREV:
        1. Bütçenin gerçekçiliğini yorumla (Örn: "Piyasanın %20 altında kalıyor").
        2. Eğer bütçe düşükse, alternatif strateji öner (Örn: "Daha eski binalara veya Sarımsaklı bölgesine yönlendirilmeli").
        3. Danışman için "Kritik Soru" öner (Örn: "Kredi mi kullanacak nakit mi?").

        TON: Profesyonel, sonuç odaklı ve dürüst.
        `;

        const response = await groqService.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        });

        return response.choices[0].message.content.trim();
    }
}

module.exports = new FinancialProfilingService();
