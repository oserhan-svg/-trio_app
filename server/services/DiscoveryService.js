const prisma = require('../db');
const GroqService = require('./GroqService');
const socketService = require('./socketService');
const aiLearningService = require('./aiLearningService');
const whatsappService = require('./whatsappService');

class DiscoveryService {
    /**
     * Scans all unlinked or new client WhatsApp chats to discover detailed leads
     */
    async discoverLeadsFromHistory() {
        console.log('🔍 [DISCOVERY] Starting Optimized Bulk Lead Discovery process...');
        try {
            // 1. Get all unique individual senders (including those in groups)
            // Use raw query for efficiency with JSON metadata
            const rawSenders = await prisma.$queryRaw`
                SELECT DISTINCT 
                    CASE 
                        WHEN "from" LIKE '%@g.us' THEN metadata->>'author' 
                        ELSE "from" 
                    END as phone
                FROM whatsapp_messages
                WHERE "from" != 'system'
            `;

            // 1.5 Filter out consultants and invalid phones
            const consultants = await prisma.user.findMany({ select: { phone: true } });
            const consultantPhones = new Set(consultants.map(c => c.phone ? c.phone.replace(/\D/g, '').slice(-10) : null).filter(Boolean));

            const senders = rawSenders
                .filter(s => s.phone && s.phone !== 'null')
                .map(s => ({ phone: s.phone.includes('@') ? s.phone : `${s.phone}@c.us` }))
                .filter(s => {
                    const cleanPhone = s.phone.replace(/\D/g, '').slice(-10);
                    return !consultantPhones.has(cleanPhone) && cleanPhone.length >= 10;
                });

            console.log(`📊 [DISCOVERY] Found ${senders.length} valid unique individual senders to analyze.`);

            let discoveredCount = 0;
            let enrichedCount = 0;

            // PERFORMANCE OPTIMIZATION: Process in batches of 3 to avoid rate limits while increasing speed
            const BATCH_SIZE = 3;
            for (let i = 0; i < senders.length; i += BATCH_SIZE) {
                const batch = senders.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (sender) => {
                    const phone = sender.phone;
                    try {
                        const cleanPhoneId = phone.split('@')[0];
                        // 2. Fetch last 50 messages for this sender (Deep scan including groups)
                        const messages = await prisma.whatsAppMessage.findMany({
                            where: {
                                OR: [
                                    { from: phone },
                                    { to: phone },
                                    {
                                        AND: [
                                            { from: { contains: '@g.us' } },
                                            {
                                                metadata: {
                                                    path: ['author'],
                                                    equals: cleanPhoneId
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            orderBy: { timestamp: 'desc' },
                            take: 50
                        });

                        if (messages.length === 0) return;

                        // 3. Combine content for analysis
                        const chatHistory = messages.slice().reverse().map(m => ({
                            role: m.from === 'system' ? 'assistant' : 'user',
                            content: m.content || ''
                        }));
                        const lastMessage = messages[0].content || '';

                        // 4. Extract detailed lead info (Using optimized GroqService)
                        const leadInfo = await GroqService.extractLeadInfo(lastMessage, chatHistory);

                        if (leadInfo && leadInfo.isPotentialLead) {
                            console.log(`🎯 [DISCOVERY] Potential lead detected: ${phone} (${leadInfo.name})`);

                            // Resolve name from system for better accuracy
                            const resolution = await whatsappService.resolveName(phone, null, null);
                            const systemName = resolution.source !== 'whatsapp' ? resolution.name : null;
                            const finalName = systemName || leadInfo.name || `WhatsApp ${phone}`;

                            // Check if client exists
                            let client = await prisma.client.findFirst({
                                where: { phone: phone }
                            });

                            if (!client) {
                                // CREATE NEW DETAILED CLIENT
                                let enrichedNotes = `[OTO-KEŞİF] ${leadInfo.summary || 'AI Tarafından keşfedildi'}`;
                                if (leadInfo.occupation) enrichedNotes += `\nMeslek: ${leadInfo.occupation}`;
                                if (leadInfo.source) enrichedNotes += `\nKaynak: ${leadInfo.source}`;
                                if (leadInfo.detailedPreferences) enrichedNotes += `\nTercihler: ${leadInfo.detailedPreferences}`;

                                client = await prisma.client.create({
                                    data: {
                                        name: finalName,
                                        phone: phone,
                                        type: leadInfo.intent === 'buy' || leadInfo.intent === 'rent_in' ? 'buyer' : 'seller',
                                        status: 'New',
                                        notes: enrichedNotes,
                                        priority_score: leadInfo.seriousnessScore || 0,
                                        last_intent_tag: leadInfo.intent,
                                        last_sentiment: leadInfo.sentiment,
                                        ai_summary: leadInfo.summary
                                    }
                                });
                                discoveredCount++;
                                console.log(`✨ [DISCOVERY] New Client Created: ${client.name} (${phone})`);

                                // NEW: Phase 3 - Auto-create Demand
                                if (leadInfo.budget || leadInfo.location || leadInfo.rooms) {
                                    await prisma.demand.create({
                                        data: {
                                            client_id: client.id,
                                            max_price: leadInfo.budget ? parseFloat(leadInfo.budget) : null,
                                            district: leadInfo.location || null,
                                            rooms: leadInfo.rooms || null
                                        }
                                    });
                                    console.log(`🎯 [AI-DEMAND] Auto-created demand for new client ${client.id}`);
                                }

                                // NEW: Phase 3 - Create AI Recommendation for Dashboard Feed
                                if (leadInfo.seriousnessScore >= 50 && messages[0]) {
                                    await prisma.aIRecommendation.create({
                                        data: {
                                            message_id: messages[0].id,
                                            recommendation: `Yeni bir potansiyel müşteri keşfedildi! ${leadInfo.summary}`,
                                            suggested_action: 'create_lead',
                                            score: leadInfo.seriousnessScore || 0,
                                            metadata: { ...leadInfo },
                                            is_applied: false
                                        }
                                    });
                                    console.log(`💡 [DISCOVERY] AI Recommendation created for ${client.name}`);
                                }
                            } else {
                                // ENRICH EXISTING CLIENT
                                const updates = {};

                                // Update name if it's currently a placeholder and we have a better one
                                const isNumericPlaceholder = /^\d+$/.test(String(client.name).replace(/\D/g, '')) && String(client.name).length > 5;
                                const isWhatsAppPlaceholder = String(client.name).includes('WhatsApp') || client.name === 'WhatsApp Grup';
                                const isCurrentPlaceholder = !client.name || isWhatsAppPlaceholder || isNumericPlaceholder;

                                if (isCurrentPlaceholder && finalName && !finalName.includes('WhatsApp')) {
                                    updates.name = finalName;
                                }

                                // Enrich notes with new findings
                                let newNoteLines = [];
                                if (leadInfo.occupation && (!client.notes || !client.notes.includes(leadInfo.occupation))) newNoteLines.push(`Meslek: ${leadInfo.occupation}`);
                                if (leadInfo.source && (!client.notes || !client.notes.includes(leadInfo.source))) newNoteLines.push(`Kaynak: ${leadInfo.source}`);
                                if (leadInfo.detailedPreferences && (!client.notes || !client.notes.includes(leadInfo.detailedPreferences))) newNoteLines.push(`Tercihler: ${leadInfo.detailedPreferences}`);

                                if (newNoteLines.length > 0) {
                                    updates.notes = `${client.notes || ''}\n[GÜNCELLEME] ${newNoteLines.join('\n')}`.trim();
                                }

                                // Only update discovery summary if not already marked
                                if (!client.notes || !client.notes.includes('[OTO-KEŞİF]')) {
                                    updates.notes = `${updates.notes || client.notes || ''}\n[OTO-KEŞİF] ${leadInfo.summary || ''}`.trim();
                                }

                                // Update score if found a higher one
                                if ((leadInfo.seriousnessScore || 0) > (client.priority_score || 0)) {
                                    updates.priority_score = leadInfo.seriousnessScore;
                                }

                                if (Object.keys(updates).length > 0) {
                                    await prisma.client.update({
                                        where: { id: client.id },
                                        data: updates
                                    });
                                    enrichedCount++;
                                    console.log(`📈 [DISCOVERY] Enriched existing client: ${client.name}`);
                                }
                            }

                            // 5. Add Demand if details found
                            if (leadInfo.budget || leadInfo.location || leadInfo.rooms) {
                                const existingDemand = await prisma.demand.findFirst({
                                    where: { client_id: client.id }
                                });

                                if (!existingDemand) {
                                    await prisma.demand.create({
                                        data: {
                                            client_id: client.id,
                                            district: leadInfo.location || null,
                                            max_price: leadInfo.budget ? parseFloat(leadInfo.budget.toString().replace(/[^0-9.]/g, '')) : null,
                                            rooms: leadInfo.rooms || null
                                        }
                                    });
                                    console.log(`🏠 [DISCOVERY] Added demand for ${client.name}`);
                                }
                            }

                            // 6. Link all messages to this client
                            await prisma.whatsAppMessage.updateMany({
                                where: {
                                    OR: [
                                        { from: phone },
                                        { to: phone },
                                        {
                                            metadata: {
                                                path: ['author'],
                                                equals: cleanPhoneId
                                            }
                                        }
                                    ],
                                    client_id: null
                                },
                                data: { client_id: client.id }
                            });

                            // 7. Update AI Summary (Hafıza)
                            await aiLearningService.summarizeClientHistory(client).catch(e => console.error('[DISCOVERY-MEM] Summary error:', e));
                        }
                    } catch (senderErr) {
                        console.error(`❌ [DISCOVERY] Error processing sender ${phone}:`, senderErr.message);
                    }
                }));

                // Progress emit after each batch
                socketService.emit('discovery_progress', {
                    current: `Batch ${i / BATCH_SIZE + 1}`,
                    discovered: discoveredCount,
                    enriched: enrichedCount,
                    total: senders.length,
                    processed: Math.min(i + BATCH_SIZE, senders.length)
                });
            }

            console.log(`✅ [DISCOVERY] Bulk discovery complete. Discovered: ${discoveredCount}, Enriched: ${enrichedCount}`);
            return { discoveredCount, enrichedCount };
        } catch (error) {
            console.error('❌ [DISCOVERY] Global Error:', error);
            throw error;
        }
    }
}

module.exports = new DiscoveryService();
