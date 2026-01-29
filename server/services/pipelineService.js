const prisma = require('../db');
const Groq = require('groq-sdk');

class PipelineService {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    /**
     * Analyzes individual client win probability and flags stagnation
     */
    async analyzeClientHealth(clientId) {
        try {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                include: {
                    whatsapp_messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    }
                }
            });

            if (!client) return null;

            // Rule-based health check
            const lastMessageAt = client.whatsapp_messages[0]?.timestamp || client.created_at;
            const daysSinceContact = Math.floor((new Date() - new Date(lastMessageAt)) / (1000 * 60 * 60 * 24));

            const isStagnant = client.status !== 'Closed Won' && client.status !== 'Closed Lost' && daysSinceContact > 3;

            // AI-based Win Probability
            let winProbability = 50; // Default
            if (this.groq && client.whatsapp_messages.length > 0) {
                const messageContent = client.whatsapp_messages.map(m => `[${m.from === client.phone ? 'CLIENT' : 'YOU'}]: ${m.content}`).join('\n');

                const prompt = `
                    AŞAĞIDAKİ WHATSAPP GÖRÜŞMESİNİ ANALİZ ET:
                    SATIŞ AŞAMASI: ${client.status}
                    MESAJLAR:
                    ${messageContent}
                    
                    GÖREV:
                    1. Satışın gerçekleşme (Won) ihtimalini %0-100 arasında bir sayı olarak ver.
                    2. İhtimalin nedenini ve bir sonraki kritik hamleyi kısaca yaz.
                    
                    JSON FORMATI:
                    {
                        "win_probability": 75,
                        "logic": "...",
                        "next_move": "..."
                    }
                `;

                const completion = await this.groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: "Sen satış pipeline analiz uzmanısın. Sadece JSON döndürürsün." }, { role: "user", content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });

                const analysis = JSON.parse(completion.choices[0].message.content);
                winProbability = analysis.win_probability;

                // Sync health data to client metadata
                await prisma.client.update({
                    where: { id: clientId },
                    data: {
                        priority_score: winProbability,
                        next_best_action: analysis.next_move
                    }
                });
            }

            let followUpDraft = null;
            if (isStagnant) {
                const GroqService = require('./GroqService');
                followUpDraft = await GroqService.generateFollowUpDraft(client);
            }

            return {
                isStagnant,
                daysSinceContact,
                winProbability,
                followUpDraft
            };
        } catch (error) {
            console.error(`Pipeline Health Error for Client #${clientId}:`, error);
            return null;
        }
    }

    /**
     * Returns pipeline summary for Kanban dashboard
     */
    async getPipelineSummary() {
        const statuses = ['New', 'Active', 'Negotiation', 'Closed Won', 'Closed Lost'];
        const summary = await Promise.all(statuses.map(async (status) => {
            const count = await prisma.client.count({ where: { status, consultant_id: { not: null } } }); // Non-trash leads
            const clients = await prisma.client.findMany({
                where: { status, consultant_id: { not: null } },
                take: 50,
                orderBy: { priority_score: 'desc' },
                select: {
                    id: true, name: true, phone: true, status: true,
                    priority_score: true, last_sentiment: true, next_best_action: true
                }
            });
            return { status, count, clients };
        }));
        return summary;
    }

    /**
     * Automatically transitions client status based on lead info
     */
    async autoTransitionClient(client, leadInfo) {
        if (!client || !leadInfo) return;

        let newStatus = client.status;
        const currentScore = leadInfo.seriousnessScore || 0;
        const lowerRecommendation = (leadInfo.summary || '').toLowerCase();

        // 1. New -> Active (Serious intent detected)
        if (client.status === 'New' && currentScore > 60) {
            newStatus = 'Active';
        }

        // 2. Active -> Negotiation (Offer or negotiation intent)
        if (client.status === 'Active' &&
            (lowerRecommendation.includes('teklif') ||
                lowerRecommendation.includes('pazarlık') ||
                lowerRecommendation.includes('randevu') ||
                currentScore >= 90)) {
            newStatus = 'Negotiation';
        }

        if (newStatus !== client.status) {
            console.log(`[PIPELINE] Auto-transitioning Client #${client.id}: ${client.status} -> ${newStatus}`);
            await prisma.client.update({
                where: { id: client.id },
                data: { status: newStatus }
            });
            return newStatus;
        }

        return null;
    }
}

module.exports = new PipelineService();
