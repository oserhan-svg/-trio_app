const prisma = require('../db');
const Groq = require('groq-sdk');

class PredictiveIntelligenceService {
    constructor() {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    async predictDealOutcome(dealId) {
        /**
         * Predicts likelihood of deal closing based on:
         * - Client engagement patterns
         * - Message sentiment history
         * - AI feature acceptance rate
         * - Time since last interaction
         * - Property match quality
         */

        const deal = await prisma.deal.findUnique({
            where: { id: parseInt(dealId) },
            include: {
                client: {
                    include: {
                        whatsapp_messages: {
                            orderBy: { timestamp: 'desc' },
                            take: 20
                        },
                        interactions: {
                            orderBy: { date: 'desc' },
                            take: 10
                        }
                    }
                },
                property: true,
                consultant: true
            }
        });

        if (!deal) return null;

        // Calculate engagement score
        const daysSinceLastContact = deal.client.last_ai_interaction
            ? Math.floor((Date.now() - new Date(deal.client.last_ai_interaction)) / (1000 * 60 * 60 * 24))
            : 999;

        const responseRate = deal.client.whatsapp_messages.filter(m => m.from.includes(deal.client.phone)).length /
            Math.max(deal.client.whatsapp_messages.length, 1);

        const hasPositiveSentiment = deal.client.last_sentiment === 'Positive' ||
            deal.client.last_sentiment === 'Excited';

        // Use LLM for nuanced prediction
        const prompt = `
Bir gayrimenkul anlaşmasının kapanma olasılığını tahmin et.

MÜŞTERİ PROFİLİ:
- Öncelik Skoru: ${deal.client.priority_score || 0}/100
- Son İletişim: ${daysSinceLastContact} gün önce
- Yanıt Oranı: ${(responseRate * 100).toFixed(0)}%
- Duygusal Durum: ${deal.client.last_sentiment || 'Bilinmiyor'}
- Mesaj Sayısı: ${deal.client.whatsapp_messages.length}

PORTFÖY UYUMU:
- Taşınmaz: ${deal.property?.title}
- Fiyat: ${deal.property?.price} TL

DANIŞMAN PERFORMANSI:
- Danışman: ${deal.consultant.name}

GÖREV:
0-100 arası bir "Kapanma Olasılığı Skoru" hesapla ve JSON formatında döndür:
{
  "closeProbability": 0-100,
  "confidence": "low/medium/high",
  "keyFactors": ["faktör1", "faktör2"],
  "suggestedActions": ["aksiyon1", "aksiyon2"],
  "estimatedDaysToClose": sayı
}
        `;

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const prediction = JSON.parse(completion.choices[0].message.content);

        // Store prediction for tracking
        await prisma.client.update({
            where: { id: deal.client.id },
            data: {
                next_best_action: prediction.suggestedActions?.[0] || null
            }
        });

        return {
            dealId,
            ...prediction,
            calculatedAt: new Date()
        };
    }

    async forecastRevenue(timeframe = 30) {
        /**
         * Forecasts revenue for next N days based on:
         * - Current pipeline deals with predictions
         * - Historical close rates
         * - Seasonal patterns
         */

        const deals = await prisma.deal.findMany({
            where: {
                status: { in: ['Active', 'Negotiation'] }
            },
            include: {
                client: true,
                property: true
            }
        });

        let totalForecast = 0;
        const predictions = [];

        for (const deal of deals) {
            const prediction = await this.predictDealOutcome(deal.id);

            if (prediction && prediction.closeProbability > 50) {
                const weightedValue = (deal.sale_price || deal.property?.price || 0) *
                    (prediction.closeProbability / 100);
                totalForecast += weightedValue;

                predictions.push({
                    dealId: deal.id,
                    clientName: deal.client?.name,
                    expectedRevenue: weightedValue,
                    probability: prediction.closeProbability,
                    estimatedCloseDate: new Date(Date.now() + (prediction.estimatedDaysToClose || 30) * 24 * 60 * 60 * 1000)
                });
            }
        }

        return {
            forecastedRevenue: totalForecast,
            highProbabilityDeals: predictions.filter(p => p.probability > 70).length,
            totalDealsInPipeline: deals.length,
            predictions: predictions.sort((a, b) => b.probability - a.probability).slice(0, 10),
            timeframe
        };
    }

    async getNextBestAction(clientId) {
        /**
         * Recommends the single most impactful next action for a client
         */

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: {
                whatsapp_messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                },
                interactions: {
                    orderBy: { date: 'desc' },
                    take: 3
                },
                demands: true
            }
        });

        if (!client) return null;

        const lastMessage = client.whatsapp_messages[0];
        const daysSinceContact = lastMessage
            ? Math.floor((Date.now() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60 * 24))
            : 999;

        // Use AI to determine optimal action
        const prompt = `
Bir emlak müşterisi için en etkili bir sonraki aksiyonu öner.

MÜŞTERİ DURUMU:
- Son İletişim: ${daysSinceContact} gün önce
- Durum: ${client.status}
- Öncelik: ${client.priority_score}/100
- AI'ya Devredilmiş: ${client.ai_delegated ? 'Evet' : 'Hayır'}
- Son Duygu: ${client.last_sentiment || 'Bilinmiyor'}
- Talep Sayısı: ${client.demands.length}

ÖNERİLEBİLECEK AKSİYONLAR:
1. send_whatsapp - Kişiselleştirilmiş mesaj gönder
2. schedule_call - Telefon görüşmesi planla
3. send_property_match - Yeni eşleşme gönder
4. schedule_showing - Gezinti ayarla
5. send_market_report - Piyasa raporu paylaş
6. update_demand - Talep güncelle

JSON formatında döndür:
{
  "action": "aksiyon_tipi",
  "reasoning": "neden bu aksiyon",
  "urgency": "low/medium/high",
  "estimatedImpact": 0-100
}
        `;

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    }
}

module.exports = new PredictiveIntelligenceService();
