const Groq = require('groq-sdk');
const prisma = require('../db');
const SearchService = require('./SearchService');
const GoogleCalendarService = require('./googleCalendarService');
const CacheService = require('./cacheService');
const ConfigService = require('./ConfigService');
const aiLogger = require('../utils/aiLogger');
const path = require('path');
const fs = require('fs');
const aiUsageService = require('./aiUsageService');

class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            console.error('CRITICAL: GROQ_API_KEY is missing!');
        }
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        this.basePersona = `
Sen 'Trio Asistan'sın. Trio Emlak'ın Ayvalık bölgesindeki (Cunda, Küçükköy, Armutçuk, Sarımsaklı) uzman gayrimenkul asistanısın.

KRİTİK HAKİMİYET VE GÜVENLİK KURALLARI:
1. AYVALIK UZMANI: Bölgedeki mahalleleri, rayiç bedellerini ve yaşam tarzını çok iyi biliyorsun.
2. MÜŞTERİ ODAKLILIK: Müşterilerin geçmiş etkileşimlerini, özel isteklerini (bahçeli, deniz manzaralı vb.) ve hassasiyetlerini unutma.
3. PROFESYONEL VE SAMİMİ: Bir emlak danışmanı gibi profesyonel, ama bölgeyi bilen biri gibi samimisin.
4. VERİ ODAKLILIK: Real estate verileri için 'SİSTEM DURUMU'nu, yazılım soruları için proje kodlarını ve logları kullan.
5. TAKVİM VE ARAÇLAR: JSON blokları ile sistem araçlarını tetikleyebilirsin.
`;
    }

    async getSystemContext(userId = null) {
        const startTime = Date.now();
        // Create cache key based on userId (different contexts for different users)
        const cacheKey = `system_context:${userId || 'global'}`;

        // Use cache with optimized TTL from config
        const cacheTTL = ConfigService.get('ai.caching.systemContextTTL', 60);
        return await CacheService.getOrSet(cacheKey, async () => {
            try {
                const config = ConfigService.getAIConfig();

                // Execute all database queries in parallel for better performance
                const [
                    propertyCount,
                    settings,
                    generalKnowledge,
                    learnedRules,
                    latestProperties,
                    agendaItems
                ] = await Promise.all([
                    prisma.property.count({ where: { status: 'active' } }),
                    prisma.systemSetting.findMany(),
                    prisma.aIKnowledge.findMany({
                        where: {
                            status: 'active',
                            category: { notIn: ['instruction', 'fix'] }
                        },
                        take: config.limits?.knowledgeItems || 5,
                        orderBy: { updated_at: 'desc' }
                    }),
                    prisma.aIKnowledge.findMany({
                        where: {
                            status: 'active',
                            category: { in: ['instruction', 'fix'] }
                        },
                        take: config.limits?.learnedRules || 10,
                        orderBy: { created_at: 'desc' }
                    }),
                    prisma.property.findMany({
                        take: config.limits?.latestPropertiesForContext || 3,
                        orderBy: { created_at: 'desc' },
                        select: { title: true, price: true, district: true, listing_type: true }
                    }),
                    // Conditionally fetch agenda items
                    userId ? prisma.agendaItem.findMany({
                        where: {
                            OR: [
                                { user_id: userId },
                                { is_global: true }
                            ],
                            start_at: { gte: new Date() }
                        },
                        take: config.limits?.agendaItemsForContext || 5,
                        orderBy: { start_at: 'asc' },
                        select: { title: true, start_at: true, type: true }
                    }) : Promise.resolve([])
                ]);

                // Build agenda text from fetched items
                let agendaText = "";
                if (agendaItems && agendaItems.length > 0) {
                    agendaText = "\nYAKLAŞAN RANDEVULARIN:\n";
                    agendaItems.forEach(item => {
                        agendaText += `- ${new Date(item.start_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} | ${item.title} (${item.type})\n`;
                    });
                }

                // Format settings for context
                const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

                const generalKnowledgeText = generalKnowledge.map(k => `* [${k.title}]: ${k.content}`).join('\n');
                const learnedRulesText = learnedRules.map(k => `* [OTO-DERS] ${k.content}`).join('\n');

                let contextText = `\n\nSİSTEM DURUMU VE PİYASA VERİLERİ (GÜNCEL):\n`;
                contextText += `- Toplam Aktif Portföy: ${propertyCount}\n`;
                if (settingsMap.rental_rate_residential) {
                    contextText += `- Bölgesel Kira Artış Oranı (Resmi/Ocak 2026): %${settingsMap.rental_rate_residential}\n`;
                }
                if (settingsMap.rental_rate_month) {
                    contextText += `- Güncel Piyasa Veri Ayı: ${settingsMap.rental_rate_month}\n`;
                }

                // Inject Knowledge Base
                if (learnedRulesText) {
                    contextText += `\nSİSTEM İÇİN ÖĞRENİLMİŞ KRİTİK KURALLAR (Bu kurallara KESİN UY):\n${learnedRulesText}\n`;
                }

                if (generalKnowledgeText) {
                    contextText += `\nÖZEL UZMANLIK BİLGİLERİ (GÜVENİLİR):\n${generalKnowledgeText}\n`;
                }

                contextText += agendaText;

                contextText += `- Bölgesel Bilgi: Ayvalık merkez, Cunda, Küçükköy ve Armutçuk ana uzmanlık alanlarımızdır.\n`;

                if (latestProperties.length > 0) {
                    contextText += `- Son Portföy Örnekleri:\n`;
                    latestProperties.forEach(p => {
                        contextText += `  * ${p.title} (${p.district}) - ${p.price} TL (${p.listing_type === 'sale' ? 'Satılık' : 'Kiralık'})\n`;
                    });
                }

                const duration = Date.now() - startTime;
                aiLogger.logPerformanceMetric('GetSystemContext', duration, { userId });

                return contextText;
            } catch (error) {
                aiLogger.logAIError('GroqService', error, { method: 'getSystemContext', userId });
                return "";
            }
        }, cacheTTL);
    }

    async getRelevantKnowledge(userMessage) {
        try {
            const lowMsg = userMessage.toLowerCase();
            const districts = ['cunda', 'küçükköy', 'armutçuk', 'sarımsaklı', 'merkez', 'ayvalık'];
            const detectedDistricts = districts.filter(d => lowMsg.includes(d));

            // Fetch knowledge base
            const knowledge = await prisma.aIKnowledge.findMany({
                where: { status: 'active' },
                orderBy: { updated_at: 'desc' }
            });

            // Filter for relevance
            let relevant = knowledge.filter(k => {
                const title = k.title.toLowerCase();
                const content = k.content.toLowerCase();
                return detectedDistricts.some(d => title.includes(d) || content.includes(d)) ||
                    lowMsg.split(' ').some(word => word.length > 4 && (title.includes(word) || content.includes(word)));
            });

            // Fallback to most recent if none specific found
            if (relevant.length === 0) {
                relevant = knowledge.slice(0, 5);
            }

            return relevant.slice(0, 10);
        } catch (error) {
            console.error('Knowledge Fetch Error:', error);
            return [];
        }
    }

    async chat(userMessage, context = null, userId = null, isWhatsApp = false, clientMemory = null) {
        const startTime = Date.now();
        aiLogger.logAIRequest('GroqChat', userMessage, { userId, isWhatsApp });

        try {
            let session = null;
            let history = [];

            // 1. Session or History Management
            if (Array.isArray(context)) {
                // Direct history passed (e.g., from WhatsApp)
                history = context;
            } else if (context) {
                // Session ID passed (e.g., from Dashboard)
                session = await prisma.aIChatSession.findUnique({
                    where: { id: parseInt(context) },
                    include: { messages: { orderBy: { created_at: 'asc' }, take: 15 } }
                });
                if (session) {
                    history = session.messages.map(m => ({ role: m.role, content: m.content }));
                }
            } else if (userId) {
                // New session for dashboard
                session = await prisma.aIChatSession.create({
                    data: {
                        user_id: userId,
                        title: userMessage.substring(0, 50) + "..."
                    }
                });
            }

            // 2. Build Messages
            const systemContext = await this.getSystemContext(userId);
            let memoryContext = "";
            if (clientMemory) {
                memoryContext = `\n\nBU MÜŞTERİ HAKKINDA HAFIZAMDAKİ BİLGİLER (Uzun Vadeli):\n${typeof clientMemory === 'string' ? clientMemory : JSON.stringify(clientMemory, null, 2)}\n`;
            }

            const messages = [
                {
                    role: "system", content: `${this.basePersona}${systemContext}${memoryContext}
Bugünün Tarihi: ${new Date().toLocaleString('tr-TR')}

KOMUTLAR (Sadece JSON):
1. { "tool": "searchProperties", "location": "Ayvalık", "type": "sale/rent", "rooms": "2+1" }
2. { "tool": "searchWeb", "query": "..." }
3. { "tool": "proposeKnowledge", "title": "...", "content": "...", "category": "regional/lead_rule" }
4. { "tool": "readLogs", "lines": 50 }
5. { "tool": "writeDeveloperNote", "title": "...", "content": "..." }
6. { "tool": "listCalendarEvents" }
7. { "tool": "createCalendarEvent", "title": "...", "description": "...", "start_at": "ISO-DATE", "end_at": "ISO-DATE" }
8. { "tool": "updateCalendarEvent", "google_event_id": "...", "title": "...", "start_at": "ISO-DATE" }
9. { "tool": "deleteCalendarEvent", "google_event_id": "..." }
10. { "tool": "updateClientDemand", "client_id": 123, "min_price": 1000000, "max_price": 2000000, "rooms": "3+1", "district": "Cunda" }
11. { "tool": "recordInteraction", "client_id": 123, "type": "whatsapp", "content": "Müşteri bölge hakkında bilgi aldı." }
12. { "tool": "updatePropertyStatus", "property_id": 456, "client_id": 123, "status": "liked" }` }
            ];

            messages.push(...history);
            messages.push({ role: "user", content: userMessage });

            // 3. Send to Groq with config-based settings
            const config = ConfigService.getAIConfig();

            // PHASE 3: Collective Intelligence Injection
            const relevantKnowledge = await this.getRelevantKnowledge(userMessage);
            if (relevantKnowledge.length > 0) {
                let knowledgeText = `\n\nKRİTİK BÖLGESEL BİLGİLER VE ÖĞRENİLMİŞ KURALLAR:\n`;
                relevantKnowledge.forEach(k => {
                    knowledgeText += `* [BİLGİ]: ${k.content}\n`;
                });
                knowledgeText += `\nTalimat: Bu bilgileri yanıtını şekillendirirken KESİN kullan. Özellikle mahalle detayları, fiyat trendleri veya operasyonel kurallar varsa bunları müşteriye uzmanlığını kanıtlamak için yansıt.`;
                messages[0].content += knowledgeText;
            }

            const completion = await this.groq.chat.completions.create({
                model: config.ai?.groqModel || "llama-3.3-70b-versatile",
                messages: messages,
                temperature: config.ai?.temperature || 0.1,
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'chat',
                    userId: userId,
                    clientId: isWhatsApp ? null : undefined // Can't easily link client here without more context, but safe enough
                });
            }

            let assistantResponse = completion.choices[0].message.content;

            // Helper to strip JSON from text
            const stripJSON = (text) => text.replace(/\{[\s\S]*"tool"[\s\S]*\}/g, "").trim();

            let toolCall = null;
            let properties = null;

            // 5. Tool Check (JSON)
            const jsonMatch = assistantResponse.match(/(\{[\s\S]*"tool"[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    const cmd = JSON.parse(jsonMatch[0]);
                    toolCall = cmd;

                    if (cmd.tool === 'searchProperties') {
                        const results = await this.executeSearchProperties(cmd);
                        properties = results;
                        assistantResponse = await this.generateSummary(userMessage, results, history, isWhatsApp);
                    }
                    else if (cmd.tool === 'searchWeb') {
                        const searchResults = await SearchService.search(cmd.query);
                        const followUpMessages = [...messages, { role: "assistant", content: assistantResponse }];
                        followUpMessages.push({
                            role: "system",
                            content: `ARAMA SONUÇLARI:\n${searchResults}\n\nTalimat:\n1. Bu sonuçları kullanarak kullanıcıya nihai cevabı ver.\n2. EĞER bu sonuçlarda bölge için kalıcı ve önemli (imar, belediye kararı, güncel rayiçler vb.) bir bilgi bulduysan, bu bilgiyi { "tool": "proposeKnowledge", ... } komutuyla sisteme kaydet.`
                        });

                        const followUpCompletion = await this.groq.chat.completions.create({
                            model: "llama-3.3-70b-versatile",
                            messages: followUpMessages,
                            temperature: 0.1
                        });

                        assistantResponse = followUpCompletion.choices[0].message.content;
                    }
                    else if (cmd.tool === 'proposeKnowledge') {
                        // Autonomous addition to knowledge base
                        await prisma.aIKnowledge.create({
                            data: {
                                title: `[Oto-Ders] ${cmd.title}`,
                                content: cmd.content,
                                category: cmd.category || 'regional',
                                status: 'active'
                            }
                        });
                    }
                    else if (['updateClientDemand', 'recordInteraction', 'updatePropertyStatus'].includes(cmd.tool)) {
                        await this.executeAgenticAction(cmd);
                    }
                    else if (cmd.tool === 'readLogs') {
                        // In a real env, we would read a file. For now, we simulate or read a specific log file if it exists.
                        try {
                            const logPath = path.join(__dirname, '../../logs/error.log'); // Adjust path as needed
                            if (fs.existsSync(logPath)) {
                                const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-cmd.lines || -50).join('\n');
                                assistantResponse = `HATA KAYITLARI (Son ${cmd.lines} satır):\n\`\`\`\n${logs}\n\`\`\`\n\nAnalizim ve çözüm önerilerim:`;
                            } else {
                                assistantResponse = "Şu an ulaşılabilir bir hata kaydı dosyası (error.log) bulunamadı. Ancak sistem genelinde kritik bir hata gözlemlemiyorum.";
                            }
                        } catch (e) {
                            assistantResponse = "Hata kayıtlarına erişim sırasında bir sorun oluştu.";
                        }
                    }
                    else if (cmd.tool === 'writeDeveloperNote') {
                        try {
                            const fileName = `${new Date().toISOString().split('T')[0]}_${cmd.title.toLowerCase().replace(/\s+/g, '_')}.md`;
                            const reportPath = path.join(__dirname, '../developer_reports', fileName);
                            const reportContent = `# Technical Report: ${cmd.title}\n\n**Date:** ${new Date().toLocaleString('tr-TR')}\n\n${cmd.content}\n\n---\n*Reported autonomously by Trio AI Assistant*`;
                            fs.writeFileSync(reportPath, reportContent);
                            console.log(`[AI-TO-AI] Technical report saved: ${fileName}`);
                            assistantResponse = `Teknik rapor '${cmd.title}' başarıyla oluşturuldu ve geliştirici ekibine iletildi.`;
                        } catch (e) {
                            console.error("Report Writing Error:", e);
                            assistantResponse = "Teknik rapor oluşturulurken bir hata oluştu.";
                        }
                    }
                    else if (cmd.tool === 'listCalendarEvents' && userId) {
                        try {
                            const events = await GoogleCalendarService.listEvents(userId);
                            assistantResponse = await this.generateCalendarSummary(events);
                        } catch (e) {
                            assistantResponse = "Google Takvim'e erişilirken bir hata oluştu veya takviminiz bağlı değil. Lütfen ayarlardan kontrol edin.";
                        }
                    }
                    else if (cmd.tool === 'createCalendarEvent' && userId) {
                        try {
                            const start = new Date(cmd.start_at);
                            const end = cmd.end_at ? new Date(cmd.end_at) : new Date(start.getTime() + 30 * 60000);

                            const isAvailable = await GoogleCalendarService.checkAvailability(userId, start, end);

                            if (!isAvailable) {
                                assistantResponse = `⚠️ Seçilen zaman diliminde takviminizde başka bir etkinlik görünüyor. Yine de oluşturmamı ister misiniz yoksa başka bir zaman mı belirleyelim?`;
                            } else {
                                const event = await GoogleCalendarService.createEvent(userId, cmd);
                                assistantResponse = `✅ Randevu başarıyla oluşturuldu: **${event.summary}**\nZaman: ${new Date(event.start.dateTime).toLocaleString('tr-TR')}`;

                                // Also save to internal agenda
                                await prisma.agendaItem.create({
                                    data: {
                                        title: cmd.title,
                                        description: cmd.description,
                                        start_at: new Date(cmd.start_at),
                                        end_at: cmd.end_at ? new Date(cmd.end_at) : null,
                                        type: 'meeting',
                                        user_id: userId,
                                        google_event_id: event.id
                                    }
                                });
                            }
                        } catch (e) {
                            assistantResponse = "Randevu oluşturulurken bir hata oluştu.";
                        }
                    }
                    else if (cmd.tool === 'updateCalendarEvent' && userId) {
                        try {
                            await GoogleCalendarService.updateEvent(userId, cmd.google_event_id, cmd);
                            assistantResponse = "✅ Randevu başarıyla güncellendi.";

                            // Sync internal
                            await prisma.agendaItem.updateMany({
                                where: { google_event_id: cmd.google_event_id },
                                data: {
                                    title: cmd.title,
                                    start_at: cmd.start_at ? new Date(cmd.start_at) : undefined
                                }
                            });
                        } catch (e) {
                            assistantResponse = "Randevu güncellenirken bir hata oluştu.";
                        }
                    }
                    else if (cmd.tool === 'deleteCalendarEvent' && userId) {
                        try {
                            await GoogleCalendarService.deleteEvent(userId, cmd.google_event_id);
                            assistantResponse = "🗑️ Randevu silindi.";

                            await prisma.agendaItem.deleteMany({
                                where: { google_event_id: cmd.google_event_id }
                            });
                        } catch (e) {
                            assistantResponse = "Randevu silinirken bir hata oluştu.";
                        }
                    }

                } catch (e) {
                    console.error("Tool Processing Error:", e);
                }
            }

            // Clean response text
            assistantResponse = stripJSON(assistantResponse);

            // 4. Persistence (Final Response)
            if (session) {
                await prisma.aIChatMessage.createMany({
                    data: [
                        { session_id: session.id, role: 'user', content: userMessage },
                        {
                            session_id: session.id,
                            role: 'assistant',
                            content: assistantResponse,
                            metadata: properties ? properties : undefined
                        }
                    ]
                });
            }

            const duration = Date.now() - startTime;
            aiLogger.logAIResponse('GroqChat', assistantResponse, duration, {
                userId,
                isWhatsApp,
                hadToolCall: !!toolCall
            });

            return {
                content: assistantResponse,
                sessionId: session?.id,
                toolCall,
                properties,
                metadata: {
                    ...properties,
                    usedCollectiveKnowledge: !!collectiveContext
                }
            };
        } catch (error) {
            aiLogger.logAIError('GroqService', error, {
                method: 'chat',
                userId,
                isWhatsApp,
                message: userMessage.substring(0, 100)
            });
            return { content: "Üzgünüm, şu an bağlantı sorunu yaşıyorum.", toolCall: null, error: error.message };
        }
    }

    async generateSummary(userQuery, searchResults, history = [], isWhatsApp = false) {
        let itemsText = "";
        if (Array.isArray(searchResults) && searchResults.length > 0) {
            itemsText = searchResults.map(p => {
                const emoji = p.category === 'land' ? '🌳' : (p.category === 'villa' ? '🏡' : '🏢');
                if (isWhatsApp) {
                    return `${emoji} *${p.title}*\n   💰 ${parseFloat(p.price).toLocaleString()} TL | 📍 ${p.district}\n   🔗 ${p.url}`;
                } else {
                    return `- [${p.title}](${p.url}) | ${p.price} TL | ${p.district} | ${p.rooms}`;
                }
            }).join('\n\n');
        } else {
            itemsText = "Kriterlere uygun aktif ilan bulunamadı.";
        }

        const systemContext = await this.getSystemContext();
        const messages = [
            { role: "system", content: `${this.basePersona}${systemContext}\n\nARAMA SONUÇLARI:\n${itemsText}\n\nTALİMAT: Sonuçları profesyonel bir dille özetle. İlanları tek tek liste yapmana gerek yok (ben kart olarak göstereceğim), sadece öne çıkanları vurgula veya genel piyasa durumu hakkında bilgi ver. Linkleri istersen metin içinde kullanabilirsin.` }
        ];

        if (Array.isArray(history)) {
            history.slice(-4).forEach(h => messages.push({ role: h.role, content: h.content }));
        }

        messages.push({ role: "user", content: `Kullanıcı sorgu: ${userQuery}` });

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.1
        });
        return completion.choices[0].message.content;
    }

    async executeSearchProperties(criteria) {
        const startTime = Date.now();
        const where = { status: 'active' };

        if (criteria.location) {
            where.OR = [
                { district: { contains: criteria.location, mode: 'insensitive' } },
                { neighborhood: { contains: criteria.location, mode: 'insensitive' } },
                { title: { contains: criteria.location, mode: 'insensitive' } }
            ];
        }

        if (criteria.minPrice || criteria.maxPrice) {
            where.price = {};
            if (criteria.minPrice) where.price.gte = parseFloat(criteria.minPrice);
            if (criteria.maxPrice) where.price.lte = parseFloat(criteria.maxPrice);
        }

        if (criteria.rooms) {
            where.rooms = { contains: criteria.rooms, mode: 'insensitive' };
        }

        if (criteria.type) {
            where.listing_type = criteria.type; // 'sale' or 'rent'
        }

        try {
            const config = ConfigService.getAIConfig();
            const results = await prisma.property.findMany({
                where,
                take: config.limits?.propertiesPerSearch || 10,
                orderBy: { price: 'asc' },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    rooms: true,
                    district: true,
                    neighborhood: true,
                    url: true,
                    images: true,
                    listing_type: true,
                    category: true
                }
            });

            const duration = Date.now() - startTime;
            aiLogger.logPerformanceMetric('SearchProperties', duration, {
                criteria,
                resultCount: results.length
            });

            return results;
        } catch (error) {
            aiLogger.logAIError('GroqService', error, { method: 'executeSearchProperties', criteria });
            return { error: error.message };
        }
    }
    async generateCalendarSummary(events) {
        if (!events || events.length === 0) return "Yakın zamanda planlanmış bir etkinliğiniz bulunmuyor.";

        const eventList = events.map(e => `- ${new Date(e.start.dateTime || e.start.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}: **${e.summary}**`).join('\n');

        const messages = [
            { role: "system", content: `${this.basePersona}\n\nETKİNLİK LİSTESİ:\n${eventList}\n\nTALİMAT: Danışmanın takvim etkinliklerini profesyonel ve özet bir şekilde sun. Önemli randevuları vurgula.` },
            { role: "user", content: "Takvimimi özetle." }
        ];

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.1
        });
        return completion.choices[0].message.content;
    }

    async generateClientDigest(client, demand, matches, interactions = []) {
        const ConfigService = require('./ConfigService');
        const companyConfig = ConfigService.getCompanyConfig();
        // Force production URL for branded links - Using the verified network address
        const baseUrl = 'https://trio-app.pages.dev';

        const propertyList = matches.map(m => {
            const emoji = m.category === 'land' ? '🌳' : (m.category === 'villa' ? '🏡' : '🏢');
            const title = m.custom_title || m.title;
            const shareUrl = m.share_token ? `${baseUrl}/listing/${m.share_token}` : m.url;

            return `${emoji} *${title}*\n   💰 ${parseFloat(m.price).toLocaleString()} TL | 📍 ${m.district}\n   📏 ${m.size_m2 || '?'} m² | 🛏️ ${m.rooms || '?'}\n   🔗 ${shareUrl}`;
        }).join('\n\n');

        const demandText = demand ? `${demand.rooms || ''} ${demand.district || ''} ${demand.min_price || 0}-${demand.max_price || '∞'} TL` : 'Genel kriterler';

        // Summarize last few interactions for context
        const recentInteractions = interactions.slice(0, 3).map(i => `- ${i.type}: ${i.content.substring(0, 50)}...`).join('\n');

        const messages = [
            {
                role: "system",
                content: `${this.basePersona}
                
                GÖREVİN: 
                Bir emlak danışmanı olarak, müşterin ${client.name} için kişiselleştirilmiş bir portföy özeti (WhatsApp mesajı) oluştur.
                
                🏘️ KURUMSAL KİMLİK:
                Sen Trio Emlak (Ayvalık) adına çalışıyorsun. Mesajın en başında mutlaka kurumsal bir başlık kullan: *🏘️ TRIO EMLAK | AYVALIK ÖZEL PORTFÖY ÖZETİ*
                
                MÜŞTERİ PROFİLİ:
                - Talep: ${demandText}
                - Notlar: ${client.notes || 'Belirtilmemiş'}
                - Son Durum: ${client.last_intent_tag || 'Normal'}
                - Ruh Hali: ${client.last_sentiment || 'Nötr'}
                - Son Etkileşimler: 
                ${recentInteractions || 'Yok'}

                EŞLEŞEN İLANLAR:
                ${propertyList}
                
                TALİMATLAR:
                1. OKUNABİLİRLİK: Mesajın bölümleri (Giriş, İlanlar, Kapanış) arasına MUTLAKA en az iki satır boşluk bırak. Mesaj sıkışık olmasın.
                2. TON: Mesaj samimi ama profesyonel olsun. Müşterinin ruh haline (${client.last_sentiment}) göre tonunu ayarla.
                3. ANALİZ: Her ilanın neden müşteri talebine uygun olduğunu (örneğin fiyat, bölge veya oda sayısı) KISACA belirt.
                4. WHATSAPP FORMATI: WhatsApp formatı kullan (kalın yazım için *text*, emojiler vb.).
                5. LİNKLER: Sadece sana verilen "🔗" linklerini kullan. Kendi linkini uydurma. Markdown linkleri KULLANMA, sadece direkt URL'leri bırak.
                6. İLETİŞİM BİLGİLERİ (ZORUNLU): Mesajın sonuna aşağıdaki bilgileri ekle:
                   
                   📞 0533 378 68 94
                   📧 ozancanserhan@gmail.com
                   📍 Trio Emlak | Ayvalık`
            },
            { role: "user", content: "Bu müşteri için harika bir özet hazırla ve en uygun ilanları öne çıkar." }
        ];

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.2
        });
        return completion.choices[0].message.content;
    }
    async generateSocialCaption(property, platform = 'instagram') {
        const prompt = `
            SEN: Sosyal Medya Uzmanı ve Emlak Danışmanısın.
            GÖREV: Aşağıdaki ilan için ${platform} platformuna uygun, etkileyici, emoji ve hashtag içeren bir paylaşım metni yaz.
            
            İLAN DETAYLARI:
            Başlık: ${property.title}
            Fiyat: ${parseFloat(property.price).toLocaleString()} TL
            Konum: ${property.district} / ${property.neighborhood}
            Özellikler: ${property.rooms}, ${property.size_m2} m²
            
            KURALLAR:
            1. Heyecan verici ve dikkat çekici bir giriş yap.
            2. Özellikleri madde madde emoji ile listele.
            3. Fiyatı vurgula.
            4. "Trio Emlak Güvencesiyle" ibaresini ekle.
            5. En alta 5-10 tane popüler emlak hashtag'i ekle (#ayvalık #satılık #villa vb.)
            6. Uzunluk: Instagram için ideal (kısa-orta).
        `;

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: "system", content: "Sen uzman bir sosyal medya içerik üreticisisin." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
        });

        return completion.choices[0]?.message?.content || "Caption oluşturulamadı.";
    }

    async extractLeadInfo(messageContent, history = []) {
        const learnedRules = await prisma.aIKnowledge.findMany({
            where: {
                status: 'active',
                category: { in: ['lead_rule', 'instruction', 'regional'] }
            },
            select: { content: true },
            take: 5 // Optimization: Limit rules to top 5 most relevant
        });
        const rulesText = learnedRules.map(r => `- ${r.content}`).join('\n');

        const prompt = `
            WhatsApp Mesajı: "${messageContent}"
            Geçmiş: ${JSON.stringify(history.slice(-10))}

            GÖREV: Yukarıdaki verileri kullanarak SADECE JSON döndür.
            
            MÜŞTERİ TANIMI (LEAD) - ÇOK KRİTİK KURALLAR:
            1. Sadece 'Merhaba', 'Selam', 'Nasılsınız', 'Hayırlı işler' diyenler MÜŞTERİ DEĞİLDİR. (isPotentialLead: false, seriousnessScore < 20)
            2. Bir ilanla ilgili fiyat, oda sayısı, konum soranlar MÜŞTERİDİR. (isPotentialLead: true, seriousnessScore >= 50)
            3. Kendi mülkünü satmak/kiralamak isteyenler MÜŞTERİDİR. (isPotentialLead: true, seriousnessScore >= 60)
            4. Randevu isteyenler MÜŞTERİDİR. (isPotentialLead: true, seriousnessScore >= 80)
            5. Başka bir emlakçı veya danışman gibi görünenler MÜŞTERİ DEĞİLDİR. (isPotentialLead: false, seriousnessScore: 0, userType: "agent")
            6. Spam, reklam veya alakasız mesajlar MÜŞTERİ DEĞİLDİR. (isPotentialLead: false, seriousnessScore: 0)
            
            ÖZET: Eğer mesajda net bir gayrimenkul niyeti (gayrimenkul alma, satma, kiralama veya detay öğrenme) yoksa KESİNLİKLE isPotentialLead: false yap. 'Naber', 'Nasılsın' gibi mesajlara kanma. 
            Sarımsaklı, Cunda, Altınova gibi Ayvalık bölgelerini ve "zeytinlik", "kooperatif", "müstakil" gibi yerel terimleri Lead tespiti için dikkate al.

            EKSTRA KURALLAR:
            ${rulesText}

            JSON FORMATI:
            {
                "isPotentialLead": boolean,
                "userType": "customer/agent/other",
                "name": "Kişinin adı veya null",
                "intent": "buy/sell/rent_in/rent_out/info/other",
                "propertyType": "daire/villa/arsa/dükkan",
                "budget": "Sayısal değer veya null",
                "location": "Bölge (Ayvalık, Cunda, vb.)",
                "rooms": "Oda sayısı (2+1, 3+1, vb.)",
                "urgency": "high/medium/low",
                "seriousnessScore": 0,
                "sentiment": "positive/neutral/negative",
                "occupation": "Meslek bilgisi (Örn: Doktor, Emekli)",
                "source": "Müşterinin bizi bulduğu yer (Sahibinden, Hepsiemlak vb.)",
                "detailedPreferences": "Asansörlü, deniz manzaralı vb. detaylar",
                "summary": "Analiz özeti"
            }`;

        try {
            const config = ConfigService.getAIConfig();
            // Critical Optimization: Use 'llama-3.1-8b-instant' for mass extraction to avoid TPD/RPM limits
            const model = config.ai?.discoveryModel || "llama-3.1-8b-instant";

            const completion = await this.groq.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: "Sen profesyonel bir veri çıkarma asistanısın. SADECE JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content);

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'lead_extraction'
                });
            }

            // Add suggested tags based on content
            if (result.isPotentialLead) {
                const tags = [];
                const lowContent = (messageContent + " " + JSON.stringify(history)).toLowerCase();
                if (lowContent.includes('bahçe')) tags.push('garden_lover');
                if (lowContent.includes('cunda')) tags.push('focus_cunda');
                if (lowContent.includes('deniz') || lowContent.includes('manzara')) tags.push('view_seeker');
                result.suggestedTags = tags;
            }

            return result;
        } catch (error) {
            console.error("Lead Extraction Error:", error.message);
            // Fallback to even lighter model if first try fails due to rate limits
            if (error.message.includes('limit') || error.message.includes('429')) {
                try {
                    const fallbackCompletion = await this.groq.chat.completions.create({
                        model: "llama-3.1-8b-instant", // Absolute fallback
                        messages: [{ role: "user", content: "Analyze this lead: " + prompt }],
                        temperature: 0,
                    });
                    return JSON.parse(fallbackCompletion.choices[0].message.content);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }
    }

    async analyzeClientHistory(client, interactions, demands, savedProperties) {
        const historyText = interactions.map(i => `[${new Date(i.date || Date.now()).toLocaleDateString()}] ${i.type}: ${i.content}`).join('\n');
        const demandText = demands.map(d => `${d.district || 'Belirtilmemiş'} ${d.rooms || ''} ${d.min_price || 0}-${d.max_price || '∞'} TL`).join(' | ');
        const propsText = savedProperties.map(p => p.property ? `${p.property.title} (${parseFloat(p.property.price).toLocaleString()} TL)` : '').join(', ');

        const prompt = `
            AŞAĞIDAKİ MÜŞTERİ VERİLERİNİ ANALİZ ET VE STRATEJİK BİR ÖZET ÇIKAR.
            
            MÜŞTERİ: ${client.name}
            TİP: ${client.type || 'Alıcı'}
            NOTLAR: ${client.notes || 'Yok'}
            TALEPLER: ${demandText || 'Yok'}
            SEÇİLEN İLANLAR: ${propsText || 'Yok'}
            ETKİLEŞİM GEÇMİŞİ:
            ${historyText || 'Henüz etkileşim yok'}

            GÖREVİN:
            1. Müşterinin asıl niyetini, motivasyonunu ve bütçe/bölge hassasiyetini analiz et.
            2. Varsa çelişkili talepleri veya kararsızlıkları belirle.
            3. Danışman için "KAZANDIRACAK STRATEJİ" ve "BİR SONRAKİ ADIM" önerisi sun.
            
            YANITINI ŞU YAPIDA VER (Markdown):
            ### 👤 Müşteri Profili
            ... (Kısa ve öz tanımlama)
            
            ### 🔍 Stratejik Analiz
            ... (Motivasyon, bütçe durumu, bölge tercihi analizi)
            
            ### 🚀 Aksiyon Planı
            - [ ] **Hemen:** ...
            - [ ] **Takip:** ...
        `;

        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: this.basePersona },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        });

        if (completion.usage) {
            await aiUsageService.logUsage({
                provider: 'groq',
                model: completion.model,
                tokensInput: completion.usage.prompt_tokens,
                tokensOutput: completion.usage.completion_tokens,
                context: 'client_analysis',
                clientId: client.id
            });
        }

        return completion.choices[0].message.content;
    }

    /**
     * Generates a structural JSON summary for the client database field 'ai_summary'
     */
    async generateAISummary(client, interactions = []) {
        const historyText = interactions.slice(0, 5).map(i => i.content).join('\n');
        const prompt = `
            Müşteri: ${client.name}
            Notlar: ${client.notes}
            Son Mesajlar: ${historyText}
            
            GÖREV: Bu müşteriyi 2-3 cümleyle özetleyen profesyonel bir paragraf ve anahtar kelimeler döndür.
            FORMAT: JSON { "paragraph": "...", "keywords": ["...", "..."] }
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'ai_summary',
                    clientId: client.id
                });
            }

            return JSON.parse(completion.choices[0].message.content);
        } catch (e) {
            return { paragraph: client.notes?.substring(0, 200), keywords: [] };
        }
    }

    async executeAgenticAction(cmd) {
        console.log(`🤖 Executing Agentic Action: ${cmd.tool}`, cmd);
        try {
            switch (cmd.tool) {
                case 'updateClientDemand':
                    await prisma.demand.create({
                        data: {
                            client_id: parseInt(cmd.client_id),
                            min_price: cmd.min_price ? parseFloat(cmd.min_price.toString().replace(/[^0-9.]/g, '')) : null,
                            max_price: cmd.max_price ? parseFloat(cmd.max_price.toString().replace(/[^0-9.]/g, '')) : null,
                            rooms: cmd.rooms?.toString(),
                            district: cmd.district
                        }
                    });
                    break;
                case 'recordInteraction':
                    await prisma.interaction.create({
                        data: {
                            client_id: parseInt(cmd.client_id),
                            type: cmd.type || 'whatsapp',
                            content: `[AI] ${cmd.content}`,
                            date: new Date()
                        }
                    });
                    break;
                case 'updatePropertyStatus':
                    await prisma.clientProperty.upsert({
                        where: {
                            client_id_property_id: {
                                client_id: parseInt(cmd.client_id),
                                property_id: parseInt(cmd.property_id)
                            }
                        },
                        update: { status: cmd.status },
                        create: {
                            client_id: parseInt(cmd.client_id),
                            property_id: parseInt(cmd.property_id),
                            status: cmd.status
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error(`Failed to execute agentic action ${cmd.tool}:`, error);
        }
    }

    async injectCollectiveIntelligence(userMessage) {
        try {
            const lowMsg = userMessage.toLowerCase();
            // Simple district detection
            const districts = ['cunda', 'küçükköy', 'armutçuk', 'sarımsaklı', 'merkez'];
            const detectedDistrict = districts.find(d => lowMsg.includes(d));

            const knowledge = await prisma.aIKnowledge.findMany({
                where: {
                    status: 'active',
                    category: { notIn: ['instruction', 'fix'] }
                },
                take: 10,
                orderBy: { updated_at: 'desc' }
            });

            // Filter relevant knowledge
            let relevant = knowledge;
            if (detectedDistrict) {
                relevant = knowledge.filter(k =>
                    k.title.toLowerCase().includes(detectedDistrict) ||
                    k.content.toLowerCase().includes(detectedDistrict)
                );
            }

            if (relevant.length === 0) return "";

            let text = `\n\nKOLEKTİF BİLGİ BİRİKİMİ (Sistemimiz tarafından diğer başarılı görüşmelerden öğrenilen kritik bilgiler):\n`;
            relevant.forEach(k => {
                text += `* [BİLGİ]: ${k.content}\n`;
            });
            text += `\nTalimat: Bu bilgileri kullanarak müşteriye uzmanlığını göster.`;

            return text;
        } catch (error) {
            return "";
        }
    }

    async generateDraftResponse(userMessage, history = [], clientMemory = null) {
        const systemContext = await this.getSystemContext();
        let memoryContext = "";
        if (clientMemory) {
            memoryContext = `\nMÜŞTERİ HAFIZASI:\n${typeof clientMemory === 'string' ? clientMemory : JSON.stringify(clientMemory, null, 2)}\n`;
        }

        const prompt = `
            SEN: Trio Emlak danışmanının asistanısın.
            GÖREV: Aşağıdaki müşteri mesajına danışman adına ("ben" diliyle) profesyonel, samimi ve ikna edici bir CEVAP TASLAĞI hazırla.
            
            UNUTMA: Bu bir taslaktır, danışman bunu kontrol edip gönderecektir. 
            - Kısa ve öz ol (WhatsApp messenger tarzı).
            - Eğer müşteri bir özellik veya portföy sorduysa ve sistemde veri yoksa, "Hemen kontrol edip dönüyorum" gibi bir geçiş kullan.
            - Bölgeye (Ayvalık/Cunda) hakimiyetini hissettir.
            
            MÜŞTERİ MESAJI: "${userMessage}"
            ${memoryContext}
            YAKIN ZAMANDA KONUŞULANLAR:
            ${JSON.stringify(history.slice(-5))}
            
            SADECE CEVAP TASLAĞINI YAZ (Başka açıklama ekleme):
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen profesyonel bir emlak danışmanı asistanısın." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            });

            return completion.choices[0].message.content.trim().replace(/^"/, "").replace(/"$/, "");
        } catch (error) {
            console.error("Draft Generation Error:", error);
            return null;
        }
    }

    async generateClientStrategy(client, interactions = [], matches = []) {
        const systemContext = await this.getSystemContext();

        const interactionsText = interactions.map(i => `[${i.date}] ${i.type}: ${i.content}`).join('\n');
        const matchesText = matches.slice(0, 3).map(m => `- ${m.title} (${m.price} TL) - Uyum: %${m.match_quality}`).join('\n');

        const prompt = `
            SEN: Profesyonel bir Emlak Satış ve CRM Stratejistisin.
            GÖREV: Aşağıdaki müşteri verilerini analiz et ve danışman için proaktif bir TAKİP STRATEJİSİ oluştur.
            
            MÜŞTERİ: ${client.name} (Tip: ${client.type}, Puan: ${client.priority_score})
            SON ETKİLEŞİMLER:
            ${interactionsText || 'Kayıt bulunamadı.'}
            
            EN UYGUN İLANLAR:
            ${matchesText || 'Uygun ilan bulunamadı.'}
            
            ANALİZ GÖREVİ:
            1. Müşterinin şu anki durumunu değerlendir (Hala sıcak mı? İlgisi dağılmış mı? Bir engeli mi var?).
            2. "Sıradaki En İyi Adım" (Next Best Action) önerisinde bulun.
            3. Danışmanın WhatsApp'tan gönderebileceği, kişiselleştirilmiş ve ikna edici bir TASLAK MESAJ hazırla.
            
            JSON FORMATI:
            {
                "analysis": "Tek cümlelik durum analizi",
                "next_step": "Yapılması gereken spesifik eylem",
                "suggested_draft": "WhatsApp için taslak mesaj"
            }
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen uzman bir CRM stratejistisin. Sadece JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("Strategy Generation Error:", error);
            return null;
        }
    }

    async transcribeAudio(filePath) {
        try {
            console.log(`🔊 Transcribing audio: ${filePath}`);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-large-v3",
                language: "tr",
                response_format: "text",
            });
            return transcription;
        } catch (error) {
            console.error('Transcription Error:', error);
            return null;
        }
    }

    async analyzeImage(filePath, prompt = "Bu emlak ilanı için gönderilmiş bir fotoğraf. Fotoğrafta neler olduğunu, oda tipini, eşya durumunu ve önemli detayları profesyonel bir dille açıkla.") {
        try {
            console.log(`📸 Analyzing image: ${filePath}`);
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = imageBuffer.toString('base64');

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.2-11b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'image_analysis'
                });
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Vision Analysis Error:', error);
            return null;
        }
    }

    async analyzePropertyImages(propertyId, images = []) {
        if (!images || images.length === 0) return [];

        console.log(`🖼️ AI Image Tagging for Property #${propertyId}...`);

        const tags = new Set();
        const features = [];

        // Analyze first 3 images (usually the most descriptive)
        for (const imgUrl of images.slice(0, 3)) {
            try {
                const absolutePath = path.join(__dirname, '../../client/public', imgUrl);
                if (fs.existsSync(absolutePath)) {
                    const analysis = await this.analyzeImage(absolutePath,
                        "Bu bir emlak fotoğrafı. SADECE şu özelliklerden hangilerini gördüğünü tek kelimelik etiketler olarak (virgülle ayırarak) yaz: havuz, bahçe, deniz_manzaralı, modern_mutfak, şömine, balkon, geniş_teras, lüks_banyo, yeni_bina, tadilatlı.");

                    if (analysis) {
                        const words = analysis.toLowerCase().split(/[,\s]+/).map(w => w.trim());
                        words.forEach(w => {
                            if (['havuz', 'bahçe', 'deniz_manzaralı', 'modern_mutfak', 'şömine', 'balkon', 'geniş_teras', 'lüks_banyo', 'yeni_bina', 'tadilatlı'].includes(w)) {
                                tags.add(w);
                            }
                        });
                        features.push(analysis);
                    }
                }
            } catch (err) {
                console.error('Image tag error:', err);
            }
        }

        const finalTags = Array.from(tags);
        if (finalTags.length > 0) {
            await prisma.property.update({
                where: { id: propertyId },
                data: {
                    metadata: {
                        ...(await prisma.property.findUnique({ where: { id: propertyId }, select: { metadata: true } })).metadata,
                        ai_image_tags: finalTags,
                        ai_visual_analysis: features.join(' | ')
                    }
                }
            });
        }

        return finalTags;
    }

    async getNegotiationAdvice(messageContent, history = []) {
        try {
            // 1. Fetch relevant "Approved Insights" from AI Knowledge
            const knowledge = await prisma.aIKnowledge.findMany({
                where: { status: 'active', category: { in: ['regional', 'general'] } },
                take: 5,
                orderBy: { updated_at: 'desc' }
            });

            const context = knowledge.map(k => `- ${k.content}`).join('\n');

            const prompt = `
MÜZAKERE ASİSTANI (Real-time Negotiation Coach):
Müşteri Mesajı: "${messageContent}"
Sohbet Geçmişi: ${history.length > 0 ? JSON.stringify(history.slice(-3)) : "Yok"}
Bölge/Piyasa Bilgileri (Kanıtlar):
${context}

GÖREV:
Bu mesajda gizli veya açık bir "İtiraz" (Objection) veya "Kararsızlık" var mı?
Varsa, danışmana bu itirazı çürütmesi için profesyonel bir taktik ve hazır cevap öner.

ÇIKTI FORMATI (JSON):
{
    "detected_objection": "Fiyat Yüksek" | "Konum Uzak" | "Zamanlama Kötü" | "Kararsızlık" | "Güven Sorunu" | null,
    "confidence_score": 0-100,
    "suggestion": {
        "tactic": "Psikolojik Taktik Adı (Örn: FOMO, Social Proof, Authority)",
        "rebuttal": "Müşteriye gönderilecek hazır cevap önerisi (Bölge bilgilerini kanıt olarak kullan)",
        "rationale": "Danışmana not: Neden bu cevabı önerdin?"
    }
}

Eğer belirgin bir itiraz veya müzakere fırsatı yoksa "detected_objection": null döndür.
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen Trio Emlak danışmanlarına satış koçluğu yapan bir yapay zekasın. JSON döndür." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2, // Low temperature for consistent JSON
                response_format: { type: "json_object" }
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'negotiation_advice'
                });
            }

            return JSON.parse(completion.choices[0].message.content);

        } catch (error) {
            console.error('Negotiation Advice Error:', error);
            return null;
        }
    }

    async getEmbeddings(text) {
        try {
            // Use lighter model or specialized embedding endpoint if available.
            // For now, we simulate or use a small model to get a 'semantic summary' 
            // which we can then hash or vectors (if actual vector DB was ready).
            // REAL IMPLEMENTATION:
            /*
            const embedding = await this.groq.embeddings.create({
                model: "nomic-embed-text-v1.5",
                input: text
            });
            return embedding.data[0].embedding;
            */

            // SIMULATED IMPLEMENTATION (Prompt Engineering fallback until Groq Embeddings are standard):
            console.log("⚠️ Using SIMULATED embeddings (Prompt Engineering) via Llama-3.3-70b");
            // We ask LLM to extract "Semantic Keywords" which we can use for weighted matching
            const prompt = `
            Extract 5-10 SEMANTIC keywords/concepts from this text that represent its core meaning (location vibe, lifestyle, property type). 
            Output ONLY a JSON array of strings.
            Text: "${text.substring(0, 500)}..."
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const keywords = JSON.parse(completion.choices[0].message.content).keywords || JSON.parse(completion.choices[0].message.content);
            return keywords; // Returning keywords as "embedding" for now to improve fuzzy search

        } catch (error) {
            console.error('Embedding Generation Error:', error);
            return null;
        }
    }

    /**
     * Analyze a successful interaction or lead and extract lessons learned
     * @param {object} context - The context (lead info, interaction content, etc.)
     */
    async analyzeAndLearn(context) {
        console.log(`[AI-LEARNING] Analyzing and learning from context...`);
        try {
            const prompt = `
                Aşağıdaki başarılı emlak etkileşimini veya müşteri adayını analiz et.
                Bu etkileşimden, sistemin gelecekte daha iyi kararlar vermesini sağlayacak 'Bölgesel Bilgi' veya 'Müşteri Davranışı Kuralı' çıkar.

                CONTEXT:
                ${JSON.stringify(context, null, 2)}

                GÖREVİN:
                1. Bu etkileşimden ne öğrendik? (Örn: Ayvalık'ta şu sokak çok popüler, veya şu kelimeler ciddi alıcıyı işaret ediyor).
                2. SADECE JSON döndür.
                
                FORMAT:
                {
                    "should_learn": boolean,
                    "title": "Kısa Öğreti Başlığı",
                    "content": "Kalıcı ve faydalı bilgi/kural içeriği",
                    "category": "regional/lead_rule",
                    "reasoning": "Neden öğrenilmeli?"
                }
            `;

            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen emlak üzerine uzmanlaşmış, sürekli öğrenen bir veri analistisin. SADECE JSON döndürürsün." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content);

            if (result.should_learn && result.content && result.title) {
                // Check if similar knowledge already exists to avoid duplication
                const existing = await prisma.aIKnowledge.findFirst({
                    where: { title: { contains: result.title } }
                });

                if (!existing) {
                    await prisma.aIKnowledge.create({
                        data: {
                            title: `[Oto-Ders] ${result.title}`,
                            content: result.content,
                            category: result.category || 'regional',
                            status: 'active'
                        }
                    });
                    console.log(`[AI-LEARNING] Successfully learned: ${result.title}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('[AI-LEARNING] Error:', error);
            return false;
        }
    }

    /**
     * Generates a WhatsApp-ready draft for property suggestions
     */
    async generatePropertySuggestionDraft(matches, clientName) {
        if (!matches || matches.length === 0) return null;

        const propertyList = matches.map((m, i) => {
            return `${i + 1}. *${m.title}*\n📍 ${m.district} / ${m.neighborhood}\n💰 ${new Intl.NumberFormat('tr-TR').format(m.price)} TL\n🛏️ ${m.rooms}\n📐 ${m.size_m2} m²\n🔗 İncele: ${m.url || 'Bize sorun.'}`;
        }).join('\n\n');

        const prompt = `
            MÜŞTERİ ADI: ${clientName || 'Değerli Müşterimiz'}
            UYGUN PORTFÖYLER:
            ${propertyList}

            GÖREV:
            Müşteriye bu portföyleri öneren, profesyonel ama samimi bir WhatsApp mesajı hazırla. 
            - Mesaj Türkçe olmalı.
            - Emojiler kullan.
            - Her mülk için kısa bir "neden uygun" cümlesi ekle (kendi yaratıcılığını kullan).
            - En sonunda bir soru sorarak etkileşim başlat.
            - SADECE mesaj metnini döndür.
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen profesyonel bir gayrimenkul danışmanısın." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'property_draft'
                });
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Groq Property Draft Error:', error);
            return null;
        }
    }

    /**
     * Generates a re-engagement (follow-up) draft for a stagnant lead
     */
    async generateFollowUpDraft(client, lastHistory) {
        if (!client) return null;

        const prompt = `
            MÜŞTERİ ADI: ${client.name}
            SON NOTLAR/KONUŞMA ÖZETİ: ${client.notes || 'Yeni müşteri'}
            MÜŞTERİ DURUMU: ${client.status} (Durgunluk: >3 gün)

            GÖREV:
            Müşteriyi sıkmadan, ilgisini tekrar çekecek, samimi ve profesyonel bir takip (follow-up) mesajı hazırla.
            - Hatırlatma yap ama baskı kurma.
            - Ayvalık bölgesindeki uzmanlığımızı hissettir.
            - Türkçe ve emojili olsun.
            - SADECE mesaj metnini döndür.
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen müşterileriyle güçlü bağlar kuran başarılı bir emlak danışmanısın." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'follow_up_draft',
                    clientId: client.id
                });
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Groq Follow-up Error:', error);
            return null;
        }
    }

    /**
     * Generates social media captions for a property listings
     */
    async generateSocialMediaContent(property) {
        if (!property) return null;

        const prompt = `
            EMLAK DETAYLARI:
            Başlık: ${property.title}
            Konum: ${property.district} / ${property.neighborhood}
            Fiyat: ${property.price}
            Özellikler: ${property.rooms} odalı, ${property.size_m2} m2
            
            GÖREV:
            Instagram ve Facebook için ilgi çekici, satış odaklı bir açıklama metni hazırla.
            - Başlık dikkat çekici olsun.
            - Emojiler kullan.
            - Uygun hashtagleri (#Ayvalık #Emlak vb.) ekle.
            - Mesaj metni samimi ama güven verici olsun.
            - SADECE açıklama metnini döndür.
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Sen bir sosyal medya pazarlama uzmanısın." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
            });

            if (completion.usage) {
                await aiUsageService.logUsage({
                    provider: 'groq',
                    model: completion.model,
                    tokensInput: completion.usage.prompt_tokens,
                    tokensOutput: completion.usage.completion_tokens,
                    context: 'social_media_content'
                });
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Groq Social Media Error:', error);
            return null;
        }
    }
}

module.exports = new GroqService();
