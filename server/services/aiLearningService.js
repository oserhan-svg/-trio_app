const prisma = require('../db');
const Groq = require('groq-sdk');
const matchingService = require('./matchingService');

class AILearningService {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    /**
     * Main optimization loop: Correlates deals with WhatsApp history to learn what works.
     */
    async runOptimization() {
        console.log('🚀 Starting AI Optimization Loop...');
        try {
            // 1. Fetch successful deals with client WhatsApp history
            const deals = await prisma.deal.findMany({
                where: {
                    status: 'closed',
                    client_id: { not: null }
                },
                include: {
                    client: {
                        include: {
                            whatsapp_messages: {
                                orderBy: { timestamp: 'asc' }
                            }
                        }
                    },
                    property: true
                },
                take: 20 // Analyze last 20 successful deals for performance
            });

            console.log(`📊 Analyzing ${deals.length} successful deals...`);

            for (const deal of deals) {
                if (!deal.client || !deal.client.whatsapp_messages.length) continue;
                await this.analyzeSuccessfulDeal(deal);
            }

            // 2. Identify regional trends from recent properties
            await this.analyzeRegionalTrends();

            // 3. Process Consultant Feedback
            await this.processNegativeFeedback();

            // 4. Update Client Long-term Memories
            await this.updateClientMemories();

            // 5. Calculate Lead Priorities
            await this.calculateClientPriorities();

            console.log('✅ AI Optimization Loop completed.');
            return { success: true, processedDeals: deals.length };
        } catch (error) {
            console.error('❌ AI Learning Error:', error);
            throw error;
        }
    }

    async analyzeSuccessfulDeal(deal) {
        const history = deal.client.whatsapp_messages
            .map(m => `${m.from === 'me' ? 'Consultant' : 'Client'}: ${m.content}`)
            .join('\n');

        const propertyInfo = deal.property
            ? `${deal.property.title} (${deal.property.district}, ${deal.property.neighborhood}) - ${deal.property.price} TL`
            : 'Unknown Property';

        const prompt = `
ANALİZ EDİLECEK BAŞARILI SATIŞ SÜRECİ:
Mülk: ${propertyInfo}
Konuşma Geçmişi:
${history}

GÖREV:
Yukarıdaki WhatsApp konuşması bir satış (deal) ile sonuçlandı.
1. Bu konuşmada müşterinin ilgisini çeken anahtar kelimeleri veya konuları belirle.
2. Danışmanın hangi tutumu veya bilgisi süreci hızlandırdı?
3. Bu başarıyı genel AI scoring sistemine nasıl yansıtabiliriz?

ÇIKTI FORMATI (Sadece JSON):
{
  "keywords": ["kelime1", "kelime2"],
  "insights": "Tek cümlelik başarı analizi",
  "suggested_rule": "AI Scoring için önerilen kural (örn: 'X bölgesi için balkon vurgusu önemli')",
  "urgency_indicator": "Yüksek satınalma niyetini belirten spesifik bir ifade"
}
        `;

        try {
            if (!this.groq) {
                console.warn('Groq API Key missing, skipping deep analysis.');
                return;
            }

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen emlak satış stratejileri uzmanısın." }, { role: "user", content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content);

            // Save to Knowledge Base
            await prisma.aIKnowledge.create({
                data: {
                    category: 'regional',
                    title: `Başarı Analizi: ${deal.client.name}`,
                    content: `[Öngörü] ${result.insights}\n[Öneri] ${result.suggested_rule}\n[Önemli Kelimeler] ${result.keywords.join(', ')}`,
                    status: 'proposed'
                }
            });

            console.log(`📝 Insight learned for Deal #${deal.id}`);

        } catch (err) {
            console.error(`Failed to analyze deal ${deal.id}:`, err);
        }
    }

    async analyzeRegionalTrends() {
        // Fetch recent active properties to see what's being listed
        const recentProperties = await prisma.property.findMany({
            where: { status: 'active' },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        if (recentProperties.length === 0) return;

        // Group by district to see where the action is
        const districtCounts = recentProperties.reduce((acc, p) => {
            acc[p.district] = (acc[p.district] || 0) + 1;
            return acc;
        }, {});

        const topDistrict = Object.entries(districtCounts)
            .sort((a, b) => b[1] - a[1])[0];

        if (topDistrict) {
            await prisma.aIKnowledge.upsert({
                where: { id: -1 }, // Use fake ID or better logic for singleton trends
                update: {
                    content: `Şu anki piyasa trendi ${topDistrict[0]} bölgesinde yoğunlaşıyor. Bu bölgeden gelen WhatsApp mesajlarına +10 puan eklenmeli.`,
                    updated_at: new Date()
                },
                create: {
                    id: -1, // Note: This might need adjustment based on DB constraints, using a conventional unique title is safer
                    category: 'instruction',
                    title: 'Current Regional Focus',
                    content: `Şu anki piyasa trendi ${topDistrict[0]} bölgesinde yoğunlaşıyor. Bu bölgeden gelen WhatsApp mesajlarına +10 puan eklenmeli.`,
                    status: 'active'
                }
            }).catch(e => {
                // If ID -1 fails (which it might in Postgres with autoincrement), use title search
                return prisma.aIKnowledge.create({
                    data: {
                        category: 'regional',
                        title: `Piyasa Trendi: ${topDistrict[0]}`,
                        content: `Şu anki piyasa trendi ${topDistrict[0]} bölgesinde yoğunlaşıyor.`,
                        status: 'active'
                    }
                });
            });
        }
    }

    async processNegativeFeedback() {
        console.log('🔍 Processing Negative Feedback...');
        try {
            // Find recommendations with negative feedback from last 3 days
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const negativeFeedbacks = await prisma.aIRecommendation.findMany({
                where: {
                    feedback: {
                        path: ['is_helpful'],
                        equals: false
                    },
                    created_at: { gte: threeDaysAgo }
                },
                include: { message: true }
            });

            console.log(`👎 Found ${negativeFeedbacks.length} negative feedbacks.`);

            for (const rec of negativeFeedbacks) {
                await this.analyzeMistake(rec);
            }
        } catch (error) {
            console.error('Feedback processing failed:', error);
        }
    }

    async analyzeMistake(rec) {
        const prompt = `
HATALI AI ÖNERİSİ ANALİZİ:
Girdi Mesajı: "${rec.message.content}"
AI Önerisi: "${rec.recommendation}"
Danışman Notu/Geri Bildirimi: "Hatalı/Faydasız"

GÖREV:
AI'ın bu mesajda neden hata yaptığını (yanlış niyet algılama, yanlış bölge, alakasız öneri vb.) tespit et ve gelecekte bu hatayı yapmaması için SİSTEM TALİMATINA eklenecek TEK CÜMLELİK bir kural yaz.

Örnek: "Müşteri 'Yalıkavak' dediğinde Bodrum genel değil, sadece Yalıkavak özelindeki portföyü vurgula."
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen AI sistemlerini eğiten uzman bir mühendissin." }, { role: "user", content: prompt }],
                temperature: 0.1
            });

            const fixRule = completion.choices[0].message.content.trim();

            if (fixRule) {
                await prisma.aIKnowledge.create({
                    data: {
                        category: 'instruction',
                        title: `Otomatik Düzeltme (Öneri #${rec.id})`,
                        content: `[Hata Düzeltme] ${fixRule}`,
                        status: 'proposed' // Proposed for admin review
                    }
                });
                console.log(`🛠️ Auto-Fix rule proposed for Rec #${rec.id}`);
            }
        } catch (err) {
            console.error('Mistake analysis failed:', err);
        }
    }

    async updateClientMemories() {
        console.log('🧠 Updating Client Long-term Memories...');
        try {
            // Fetch clients with recent messages (last 7 days) and AI delegation
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const activeClients = await prisma.client.findMany({
                where: {
                    whatsapp_messages: {
                        some: { timestamp: { gte: sevenDaysAgo } }
                    }
                },
                include: {
                    whatsapp_messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 30
                    }
                }
            });

            console.log(`🧠 Found ${activeClients.length} clients to analyze for memory.`);

            for (const client of activeClients) {
                await this.summarizeClientHistory(client);
            }
        } catch (error) {
            console.error('Memory update failed:', error);
        }
    }

    async summarizeClientHistory(client) {
        if (!client.whatsapp_messages || client.whatsapp_messages.length === 0) return;

        const chatLog = client.whatsapp_messages
            .reverse()
            .map(m => `${m.from === 'system' ? 'Asistan' : 'Müşteri'}: ${m.content}`)
            .join('\n');

        const prompt = `
MÜŞTERİ HAFIZA ANALİZİ:
Müşteri Adı: ${client.name}
Son Mesajlar:
${chatLog}

GÖREV:
Bu müşterinin emlak tercihlerini, bütçesini, aradığı bölgeleri ve karakter özelliklerini (titiz, acelesi var, yatırımcı vb.) SADECE JSON formatında özetle. Önemli bir bilgi değişmediyse mevcut özeti koru.

JSON FORMATI:
{
  "preferences": "...",
  "budget_info": "...",
  "target_locations": ["...", "..."],
  "character_traits": "...",
  "last_summary": "Kısa bir cümlelik özet"
}
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen profesyonel bir emlak asistanı hafıza yönetim sistemisin." }, { role: "user", content: prompt }],
                temperature: 0,
                response_format: { type: "json_object" }
            });

            const summary = JSON.parse(completion.choices[0].message.content);

            await prisma.client.update({
                where: { id: client.id },
                data: { ai_summary: summary }
            });

            console.log(`🧠 Memory updated for client: ${client.name}`);
        } catch (err) {
            console.error(`Summarization failed for client ${client.id}:`, err);
        }
    }

    async calculateClientPriorities() {
        console.log('⚖️ Calculating Lead Priorities...');
        try {
            const clients = await prisma.client.findMany({
                where: { ai_delegated: true }
            });

            for (const client of clients) {
                await this.updateSingleClientPriority(client);
            }
        } catch (error) {
            console.error('Priority calculation failed:', error);
        }
    }

    async updateSingleClientPriority(client) {
        try {
            let score = 0;
            let intentTag = null;

            // 1. Seriousness Analysis (from AI Summary)
            const summary = client.ai_summary || {};
            const lastSummary = (summary.last_summary || '').toLowerCase();

            if (lastSummary.includes('teklif') || lastSummary.includes('satın alma')) {
                score += 50;
                intentTag = 'Sıcak Takip';
            } else if (lastSummary.includes('randevu') || lastSummary.includes('ziyaret')) {
                score += 40;
                intentTag = 'Görüşme Bekliyor';
            } else if (lastSummary.includes('bilgi istedi')) {
                score += 15;
            }

            // 2. Match Quality (from Matching Service)
            const matches = await matchingService.findMatchesForClient(client.id);
            const bestMatch = matches[0];
            if (bestMatch) {
                if (bestMatch.match_quality >= 90) score += 30;
                else if (bestMatch.match_quality >= 80) score += 20;
                else if (bestMatch.match_quality >= 70) score += 10;
            }

            // 3. Recency Penalty (Engagement decay)
            const lastInteraction = client.last_ai_interaction ? new Date(client.last_ai_interaction) : new Date(0);
            const daysSinceInteraction = (new Date() - lastInteraction) / (1000 * 60 * 60 * 24);

            if (daysSinceInteraction < 1) score += 20; // Active today
            else if (daysSinceInteraction > 7) score -= 30; // cold lead

            // 4. Emotional Intelligence Factor
            if (client.last_sentiment === 'urgent') score += 20;
            else if (client.last_sentiment === 'excited') score += 15;
            else if (client.last_sentiment === 'frustrated') score += 5; // Needs attention!
            else if (client.last_sentiment === 'hesitant') score -= 10;

            // Guard rails
            score = Math.max(0, Math.min(100, score));

            // 5. Predict Next Action (Phase 14)
            const nextAction = await this.predictNextAction(client, matches);
            const isStale = this.checkIfStale(client, score);

            await prisma.client.update({
                where: { id: client.id },
                data: {
                    priority_score: score,
                    last_intent_tag: intentTag,
                    next_best_action: nextAction,
                    is_stale: isStale
                }
            });

            console.log(`⚖️ Priority [${score}] and Next Action [${nextAction}] updated for ${client.name}`);
        } catch (err) {
            console.error(`Status update failed for client ${client.id}:`, err);
        }
    }

    async predictNextAction(client, matches) {
        try {
            const lastInteraction = client.last_ai_interaction ? new Date(client.last_ai_interaction) : new Date(0);
            const daysSinceInteraction = (new Date() - lastInteraction) / (1000 * 60 * 60 * 24);
            const bestMatch = matches[0];

            // Rule-based prediction (can be enhanced with LLM later)
            if (client.last_intent_tag === 'Randevu İstendi') return "Görüşme lokasyonunu paylaş ve teyit al";
            if (client.last_intent_tag === 'Ciddi Alıcı' && bestMatch) return `En uyumlu portföyü (${bestMatch.title}) detaylıca sun`;
            if (client.last_sentiment === 'frustrated') return "Müşteriyi arayarak sorunları dinle ve güven tazele";
            if (daysSinceInteraction > 2 && client.priority_score > 50) return "Sıcak bir takip mesajı gönder";
            if (bestMatch && bestMatch.match_quality > 85) return "Yeni eşleşen mülk için randevu öner";

            return "Portföydeki yeni gelişmeleri paylaş";
        } catch (error) {
            return "Takip mesajı gönder";
        }
    }

    checkIfStale(client, currentScore) {
        if (!client.last_ai_interaction) return false;
        const lastInteraction = new Date(client.last_ai_interaction);
        const hoursSinceInteraction = (new Date() - lastInteraction) / (1000 * 60 * 60);

        // A lead is "stale" if high priority (>60) but no talk for >48h
        return currentScore > 60 && hoursSinceInteraction > 48;
    }

    async detectStaleLeads() {
        try {
            console.log('🔍 Running Stale Lead Detection...');
            const potentialStaleClients = await prisma.client.findMany({
                where: {
                    priority_score: { gt: 50 },
                    last_ai_interaction: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
                    status: { notIn: ['Closed Won', 'Closed Lost'] }
                }
            });

            for (const client of potentialStaleClients) {
                await prisma.client.update({
                    where: { id: client.id },
                    data: { is_stale: true }
                });
                console.warn(`🔥 Lead STALE: ${client.name} (hasn't talked for >48h)`);
            }
            return potentialStaleClients.length;
        } catch (error) {
            console.error('Stale lead detection failed:', error);
            return 0;
        }
    }
}

module.exports = new AILearningService();
