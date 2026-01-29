const prisma = require('../db');
const Groq = require('groq-sdk');
const whatsappService = require('./whatsappService');
const matchingService = require('./matchingService');

class ProactiveAIService {
    constructor() {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    async runProactiveFollowups() {
        console.log('🚀 Starting Proactive AI Follow-up Loop...');
        try {
            // Find clients who:
            // 1. Are AI Delegated
            // 2. Last interaction was between 24 and 48 hours ago
            // 3. Haven't received a proactive message today (simple guard)
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const fortyEightHoursAgo = new Date();
            fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

            const idleClients = await prisma.client.findMany({
                where: {
                    ai_delegated: true,
                    last_ai_interaction: {
                        gte: fortyEightHoursAgo,
                        lte: twentyFourHoursAgo
                    }
                }
            });

            console.log(`🚀 Found ${idleClients.length} idle delegated clients for follow-up.`);

            for (const client of idleClients) {
                await this.sendFollowUp(client);
            }
        } catch (error) {
            console.error('Proactive Follow-up error:', error);
        }
    }

    async sendFollowUp(client) {
        try {
            const memory = client.ai_summary || "Hafızada henüz özel bir bilgi yok.";

            const prompt = `
PROAKTİF TAKİP MESAJI OLUŞTURMA:
Müşteri Adı: ${client.name}
Müşteri Hakkındaki Hafızam: ${JSON.stringify(memory)}

GÖREV:
Bu müşteriye, Trio Emlak asistanı olarak, nazik ve samimi bir takip (follow-up) mesajı yaz. 
Mesaj, müşterinin daha önce ilgilendiği bölgeye veya özelliklere (varsa) atıfta bulunmalı. 
Amacımız satış baskısı kurmak değil, "hala yanındayız" mesajı vermek ve yeni bir ilan/bilgi varsa paylaşmak için kapı açmaktır.

KURALLAR:
1. Türkçe olsun.
2. Kısa ve WhatsApp formatına uygun olsun.
3. Samimi ama profesyonel olsun (Ayvalık/Cunda esnafı sıcaklığıyla).
4. Asla yapay zeka olduğunu belli etme, Trio Asistan olarak konuş.

SADECE mesaj içeriğini döndür.
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen Trio Emlak'ın Ayvalık bölgesindeki uzman proaktif asistanısın." }, { role: "user", content: prompt }],
                temperature: 0.7
            });

            const messageContent = completion.choices[0].message.content.trim();

            if (messageContent) {
                console.log(`🚀 Sending Proactive Follow-up to ${client.phone}: ${messageContent.substring(0, 50)}...`);
                await whatsappService.sendMessage(client.phone, messageContent);

                // Update last interaction to prevent spamming
                await prisma.client.update({
                    where: { id: client.id },
                    data: { last_ai_interaction: new Date() }
                });

                // Log the message in DB
                await prisma.whatsAppMessage.create({
                    data: {
                        whatsapp_id: 'ai-proactive-' + Date.now(),
                        from: 'system',
                        to: client.phone,
                        content: messageContent,
                        sender_name: 'Trio Asistan (Proaktif)',
                        timestamp: new Date(),
                        client_id: client.id
                    }
                });
            }
        } catch (err) {
            console.error(`Follow-up failed for client ${client.id}:`, err);
        }
    }

    async checkNewMatchesForDelegatedClients() {
        console.log('🚀 Checking for new property matches for delegated clients...');
        try {
            const delegatedClients = await prisma.client.findMany({
                where: { ai_delegated: true },
                include: { demands: true }
            });

            for (const client of delegatedClients) {
                const matches = await matchingService.findMatchesForClient(client.id);
                // Only high-quality matches
                const topMatch = matches.find(m => m.match_quality >= 85);

                if (topMatch) {
                    // Check if this property was already sent to this client via WhatsApp
                    const alreadySent = await prisma.whatsAppMessage.findFirst({
                        where: {
                            client_id: client.id,
                            content: { contains: topMatch.id.toString() }
                        }
                    });

                    if (!alreadySent) {
                        await this.sendPropertyPitch(client, topMatch);
                    }
                }
            }
        } catch (error) {
            console.error('Proactive Match Error:', error);
        }
    }

    async sendPropertyPitch(client, property) {
        try {
            const memory = client.ai_summary || "Hafızada özel bir bilgi yok.";
            const prompt = `
YENİ İLAN PİTCHİ OLUŞTURMA:
Müşteri: ${client.name}
Müşteri Hafızası: ${JSON.stringify(memory)}
Yeni İlan: ${property.title} (${property.district})
Fiyat: ${property.price} TL
Eşleşme Nedeni: ${property.match_reasons.join(', ')}

GÖREV:
Bu müşteriye, Trio Emlak asistanı olarak, bu yeni ilanı "kişisel bir öneri" gibi sunan samimi bir mesaj yaz. 
Müşterinin geçmiş tercihlerine (hafızadaki bilgiler) atıfta bulunarak neden bu ilanı beğenebileceğini açıkla.
Mesajın sonuna ilanın linkini ekle: http://trioemlak.com/p/${property.id}

KURALLAR:
1. Samimi, uzman ve heyecan verici olsun.
2. Linki en sona ekle.
3. Asla robot gibi konuşma, "Sizin için şunu buldum" tonunda ol.

SADECE mesajı döndür.
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen Trio Emlak'ın Ayvalık bölgesi uzmanısın." }, { role: "user", content: prompt }],
                temperature: 0.6
            });

            const pitch = completion.choices[0].message.content.trim();

            if (pitch) {
                console.log(`🚀 Sending Proactive Pitch to ${client.phone} for Prop #${property.id}`);
                await whatsappService.sendMessage(client.phone, pitch);

                await prisma.whatsAppMessage.create({
                    data: {
                        whatsapp_id: 'ai-pitch-' + Date.now(),
                        from: 'system',
                        to: client.phone,
                        content: pitch,
                        sender_name: 'Trio Asistan (Öneri)',
                        timestamp: new Date(),
                        client_id: client.id
                    }
                });
            }
        } catch (err) {
            console.error(`Pitch failed for client ${client.id}:`, err);
        }
    }

    async automatedNurturingFlow() {
        console.log('🚀 Starting Automated Nurturing Flow...');
        try {
            // Find high priority clients (score > 70) who haven't talked for >36h
            const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);

            const coolingLeads = await prisma.client.findMany({
                where: {
                    ai_delegated: true,
                    priority_score: { gt: 70 },
                    last_ai_interaction: { lt: thirtySixHoursAgo },
                    status: { notIn: ['Closed Won', 'Closed Lost'] }
                }
            });

            for (const client of coolingLeads) {
                await this.sendNurturingMessage(client);
            }
        } catch (error) {
            console.error('Nurturing flow error:', error);
        }
    }

    async sendNurturingMessage(client) {
        try {
            // Fetch some approved regional knowledge to share
            const knowledge = await prisma.aIKnowledge.findMany({
                where: { status: 'active', category: 'regional' },
                take: 1,
                orderBy: { updated_at: 'desc' }
            });

            const news = knowledge[0]?.content || "Ayvalık genelinde gayrimenkul hareketliliği devam ediyor.";

            const prompt = `
NURTURING (ISITMA) MESAJI OLUŞTURMA:
Müşteri: ${client.name}
Bölge Haberi/Bilgisi: ${news}

GÖREV:
Bu müşteriye, Trio Emlak asistanı olarak, satış baskısı kurmadan "ilginizi çekeceğini düşündüm" tadında bir değer katma mesajı yaz. 
Kayıtlarımızdaki bölge bilgisini/haberini paylaş ve nazikçe hala yardımcı olabileceğimizi hatırlat.

KURALLAR:
1. Çok kısa ve WhatsApp dostu olsun.
2. Fazla resmi olmasın (Ayvalık sıcaklığında).
3. "Sadece bir bilgi paylaşmak istedim" havasında olsun.

SADECE mesaj içeriğini döndür.
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "Sen Trio Emlak'ın Ayvalık uzmanısın." }, { role: "user", content: prompt }],
                temperature: 0.6
            });

            const nurturingMsg = completion.choices[0].message.content.trim();

            if (nurturingMsg) {
                console.log(`🚀 Sending Nurturing Message to ${client.phone}`);
                await whatsappService.sendMessage(client.phone, nurturingMsg);

                await prisma.whatsAppMessage.create({
                    data: {
                        whatsapp_id: 'ai-nurture-' + Date.now(),
                        from: 'system',
                        to: client.phone,
                        content: nurturingMsg,
                        sender_name: 'Trio Asistan (Nurture)',
                        timestamp: new Date(),
                        client_id: client.id
                    }
                });

                await prisma.client.update({
                    where: { id: client.id },
                    data: { last_ai_interaction: new Date() }
                });
            }
        } catch (err) {
            console.error(`Nurture message failed for ${client.id}:`, err);
        }
    }

    async runCompetitiveAnalysis(client) {
        try {
            console.log(`📊 Running Competitive Analysis for ${client.name}...`);
            // 1. Identify Client's Interest
            // For MVP, we check their specific Demand or Last Interaction
            const demand = await prisma.demand.findFirst({
                where: { client_id: client.id },
                orderBy: { created_at: 'desc' }
            });

            if (!demand || !demand.district) {
                console.log('No specific district demand found, skipping comp analysis.');
                return;
            }

            // 2. Run Cross-Platform Search
            const { findComparableListings, detectArbitrage } = require('./stealthScraper');

            const criteria = {
                district: demand.district,
                price_min: demand.price_min || (demand.max_price ? demand.max_price * 0.7 : 0),
                price_max: demand.max_price || (demand.price_min ? demand.price_min * 1.3 : 0),
                rooms: demand.rooms
            };

            const comparables = await findComparableListings(criteria);

            // 3. Detect Arbitrage / Market Position
            // We need a "Target Property" to compare against. 
            // If the client is interested in a specific property (e.g. from an interaction), use that.
            // Otherwise, we just give general market stats.

            const interestInteraction = await prisma.interaction.findFirst({
                where: { client_id: client.id, type: 'property_interest' },
                orderBy: { date: 'desc' },
                include: { property: true }
            });

            if (interestInteraction && interestInteraction.property) {
                const targetProperty = interestInteraction.property;
                const analysis = detectArbitrage(targetProperty, comparables);

                if (analysis && analysis.status.includes('Opportunity')) {
                    const reportMsg = `📢 FIRSAT ALARMI: İlgilendiğiniz ${targetProperty.title} portföyü, şu an piyasadaki ${analysis.comparableCount} benzer ilana göre %${Math.abs(analysis.percentageDiff)} daha uygun fiyatlı! (Ortalama Piyasa: ${analysis.marketAverage.toLocaleString('tr-TR')} TL)`;

                    console.log(`💰 ARBITRAGE FOUND: ${reportMsg}`);

                    if (client.ai_delegated) {
                        await whatsappService.sendMessage(client.phone, reportMsg);
                        // Log
                        await prisma.whatsAppMessage.create({
                            data: {
                                whatsapp_id: 'ai-comp-' + Date.now(),
                                from: 'system',
                                to: client.phone,
                                content: reportMsg,
                                sender_name: 'Trio Market Analiz',
                                timestamp: new Date(),
                                client_id: client.id
                            }
                        });
                    }
                }
            } else {
                // General Market Report
                if (comparables.length > 0) {
                    const avgPrice = comparables.reduce((s, c) => s + c.price, 0) / comparables.length;
                    console.log(`📈 Market Report for ${demand.district}: Avg Price ${avgPrice}`);
                    // Optionally notify consultant or client about general trends
                }
            }

        } catch (error) {
            console.error('Competitive Analysis Failed:', error);
        }
    }
}

module.exports = new ProactiveAIService();
