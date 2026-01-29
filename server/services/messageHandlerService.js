const whatsappService = require('./whatsappService');
const prisma = require('../db');
const GroqService = require('./GroqService');
const pipelineService = require('./pipelineService');
const transcriptionService = require('./TranscriptionService');
const geminiService = require('./GeminiService');
const socketService = require('./socketService');
const fs = require('fs');
const path = require('path');

// Set of message IDs currently being processed to prevent race conditions
const messageLocks = new Set();

// Helper to resolve sender name
async function resolveSenderName(phoneNumber, waContact, waChat) {
    const resolution = await whatsappService.resolveName(phoneNumber, waContact, waChat);
    if (resolution.source === 'whatsapp' && /^\d+$/.test(resolution.name.replace(/\D/g, ''))) {
        const notifyName = waContact?.pushname || waContact?.verifiedName || waChat?._data?.notifyName;
        if (notifyName && !/^\d+$/.test(notifyName.replace(/\D/g, ''))) {
            return { name: notifyName, isConsultant: false, source: 'whatsapp_metadata' };
        }
    }
    return resolution;
}

/**
 * Handle incoming/outgoing WhatsApp messages
 */
async function handleMessage(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    const isGroup = chat.isGroup;
    const chatId = chat.id._serialized;
    const authorId = isGroup ? (message.author || message.from).split('@')[0] : chat.id.user;

    const lockKey = chatId + message.id.id; // Use unique message ID for locking
    if (messageLocks.has(lockKey)) return;

    try {
        messageLocks.add(lockKey);

        if (message.type !== 'chat' && message.type !== 'ptt' && message.type !== 'audio' && message.type !== 'image') {
            messageLocks.delete(lockKey);
            return;
        }

        let messageContent = message.body || "";

        // NEW: Phase 5 - Multimodal Processing
        if (message.hasMedia) {
            try {
                const media = await message.downloadMedia();
                if (media) {
                    const buffer = Buffer.from(media.data, 'base64');

                    if (message.type === 'ptt' || message.type === 'audio') {
                        console.log(`[MULTIMODAL] Transcribing audio from ${chatId}...`);
                        const transcript = await transcriptionService.transcribeAudio(buffer, media.mimetype);
                        if (transcript) {
                            console.log(`[MULTIMODAL] Transcript: ${transcript}`);
                            messageContent = `[SESLİ MESAJ DEŞİFRESİ]: ${transcript}`;
                        }
                    } else if (message.type === 'image') {
                        console.log(`[MULTIMODAL] Analyzing image from ${chatId}...`);
                        const description = await geminiService.analyzeImage(buffer, media.mimetype);
                        if (description) {
                            console.log(`[MULTIMODAL] Image Description: ${description}`);
                            messageContent = `[GÖRSEL ANALİZİ]: ${description}`;
                        }
                    }
                }
            } catch (mediaError) {
                console.error('[MULTIMODAL] Error processing media:', mediaError);
            }
        }

        // PHASE 0: Early Exit for loop prevention
        if (message.fromMe && message.id._serialized.startsWith('ai-')) {
            // Already processed this as an AI response
            messageLocks.delete(lockKey);
            return;
        }

        // Noise filter for groups: Only process if it looks like real estate talk
        if (isGroup) {
            const lowMsg = messageContent.toLowerCase();
            const realEstateKeywords = ['daire', 'arsa', 'kira', 'satılık', 'fiyat', 'bütçe', 'oda', 'm2', 'konum', 'randevu', 'teklif', 'almak', 'satmak', 'villa', 'müstakil', 'bahçe'];
            const isRelevant = realEstateKeywords.some(kw => lowMsg.includes(kw));

            if (!isRelevant) {
                console.log(`[WA] Skipping group message (noise filtering): ${messageContent.substring(0, 30)}...`);
                messageLocks.delete(lockKey);
                // Still upsert the message for history, but skip AI logic
                try {
                    await prisma.whatsAppMessage.upsert({
                        where: { whatsapp_id: message.id._serialized },
                        update: {},
                        create: {
                            whatsapp_id: message.id._serialized,
                            from: message.fromMe ? 'system' : chatId,
                            to: message.fromMe ? chatId : 'system',
                            content: messageContent,
                            sender_name: message.fromMe ? 'Trio Emlak' : (message._data?.notifyName || contact.pushname || contact.verifiedName || authorId),
                            timestamp: new Date(message.timestamp * 1000),
                            metadata: {
                                author: authorId,
                                is_group: true,
                                notifyName: message._data?.notifyName
                            }
                        }
                    });
                } catch (e) { }
                return;
            }
        }

        // Phase 13: Multimodal Processing (Client Link Logic)
        if (message.media) {
            try {
                // Adjust path as needed, assuming this runs from server root context
                const absolutePath = path.join(__dirname, '../../client/public', message.media.url);
                if (fs.existsSync(absolutePath)) {
                    if (message.type === 'ptt' || message.type === 'audio') {
                        const transcript = await GroqService.transcribeAudio(absolutePath);
                        if (transcript) {
                            messageContent = `[SESLİ MESAJ]: ${transcript}${messageContent ? '\nNot: ' + messageContent : ''}`;
                            message.ai_transcription = transcript;
                        }
                    } else if (message.type === 'image') {
                        const analysis = await GroqService.analyzeImage(absolutePath);
                        if (analysis) {
                            messageContent = `[GÖRSEL ANALİZİ]: ${analysis}${messageContent ? '\nNot: ' + messageContent : ''}`;
                            message.ai_analysis = analysis;
                        }
                    }
                }
            } catch (mediaErr) {
                console.error('Multimodal processing error:', mediaErr);
            }
        }

        const resolution = await resolveSenderName(authorId, contact, chat);
        const resolvedName = resolution.name;

        console.log(`Received WhatsApp message from ${authorId} in ${chatId}: ${messageContent}`);

        const isConsultant = resolution.isConsultant;
        if (isConsultant) {
            console.log(`[AUTH] Consultant detected: ${resolvedName}`);
            // Explicitly tag the client as consultant in DB if not already tagged
            if (!isGroup) {
                const existingClient = await prisma.client.findFirst({
                    where: { phone: authorId }
                });
                if (existingClient && (existingClient.last_intent_tag !== 'consultant' || existingClient.type !== 'consultant')) {
                    await prisma.client.update({
                        where: { id: existingClient.id },
                        data: {
                            last_intent_tag: 'consultant',
                            type: 'consultant'
                        }
                    });
                }
            }
        } else {
            if (!isGroup) await chat.sendStateTyping();
        }

        const conversationHistory = await prisma.whatsAppMessage.findMany({
            where: { OR: [{ from: chatId }, { to: chatId }] },
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        let client = await prisma.client.findFirst({
            where: { phone: isGroup ? chatId : authorId }
        });

        // AUTO-CORRECT: If client exists but has a placeholder name, attempt to fix it automatically
        if (client && !isGroup) {
            const isNumericPlaceholder = /^\d+$/.test(String(client.name).replace(/\D/g, '')) && String(client.name).length > 5;
            const isWhatsAppPlaceholder = String(client.name).includes('WhatsApp') || client.name === 'WhatsApp Grup';
            const isCurrentPlaceholder = !client.name || isWhatsAppPlaceholder || isNumericPlaceholder;
            const isNewNameValid = resolvedName && !resolvedName.includes('WhatsApp') && !/^\d+$/.test(resolvedName.replace(/\D/g, ''));

            if (isCurrentPlaceholder && isNewNameValid) {
                console.log(`♻️ [AUTO-FIX] Correcting placeholder name for ${client.phone}: ${client.name} -> ${resolvedName}`);
                client = await prisma.client.update({
                    where: { id: client.id },
                    data: { name: resolvedName }
                });
            }
        }

        // Auto-resolve group name if client doesn't exist yet
        if (!client && isGroup) {
            const groupInfo = await resolveSenderName(chatId, null, chat);
            client = await prisma.client.create({
                data: {
                    name: groupInfo.name || `Grup ${chatId}`,
                    phone: chatId,
                    type: 'group',
                    status: 'New'
                }
            });
        }

        let aiResponse;
        let toolCall;
        let properties;
        let finalAiId = null;

        if (!isConsultant && !message.fromMe) {
            try {
                // 1. Handle Auto-Reply if Delegated
                if (client?.ai_delegated) {
                    const history = conversationHistory.slice().reverse().map(m => ({
                        role: m.from === authorId ? 'user' : 'assistant',
                        content: m.content
                    }));

                    const result = await GroqService.chat(messageContent, history, null, true, client?.ai_summary);
                    aiResponse = result.content;
                    toolCall = result.toolCall;
                    properties = result.properties;

                    await chat.sendPresenceAvailable();
                    // REPLY TO THE CHAT (Group or Individual), not the author individually
                    const sentMsg = await whatsappService.sendMessage(chatId, aiResponse);
                    // Use real WA ID if available for persistence
                    const finalAiId = sentMsg?.id?._serialized || 'ai-' + Date.now();

                    // Update last AI interaction timestamp
                    if (client) {
                        const lowContent = messageContent.toLowerCase();
                        let newIntent = null;
                        let priorityBoost = 0;

                        if (lowContent.includes('randevu') || lowContent.includes('görüşme') || lowContent.includes('ziyaret')) {
                            newIntent = 'Randevu İstendi';
                            priorityBoost = 40;
                        } else if (lowContent.includes('teklif') || lowContent.includes('almak istiyorum')) {
                            newIntent = 'Ciddi Alıcı';
                            priorityBoost = 50;
                        }

                        await prisma.client.update({
                            where: { id: client.id },
                            data: {
                                last_ai_interaction: new Date(),
                                last_intent_tag: newIntent || client.last_intent_tag,
                                priority_score: { increment: priorityBoost }
                            }
                        });

                        // Emit real-time alert for High Intent
                        if (newIntent) {
                            socketService.emit('ai_intent_alert', {
                                clientId: client.id,
                                clientName: client.name,
                                intent: newIntent,
                                message: messageContent
                            });
                        }
                    }
                } else if (!isConsultant && !isGroup) {
                    // IF DELEGATION IS OFF: Generate a draft for the consultant
                    const history = conversationHistory.slice().reverse().map(m => ({
                        role: m.from === authorId ? 'user' : 'assistant',
                        content: m.content
                    }));

                    GroqService.generateDraftResponse(messageContent, history, client?.ai_summary)
                        .then(draft => {
                            if (draft) {
                                socketService.emit('whatsapp_draft', {
                                    phone: authorId,
                                    draft: draft
                                });
                            }
                        }).catch(err => console.error('Draft error:', err));
                }

                // Lead Extraction and recommendations
                const leadInfo = await GroqService.extractLeadInfo(messageContent, conversationHistory);

                // Categorization Filter: Skip recommendations if it's an agent or not a potential lead
                if (leadInfo?.isPotentialLead && leadInfo.seriousnessScore > 50 && leadInfo.userType !== 'agent') {
                    const rec = await prisma.aIRecommendation.create({
                        data: {
                            message: {
                                connectOrCreate: {
                                    where: { whatsapp_id: message.id._serialized },
                                    create: {
                                        whatsapp_id: message.id._serialized,
                                        from: message.fromMe ? 'system' : chatId,
                                        to: message.fromMe ? chatId : 'system',
                                        content: messageContent,
                                        sender_name: message.fromMe ? 'Trio Emlak' : (message._data?.notifyName || resolvedName),
                                        timestamp: new Date(message.timestamp * 1000),
                                        client_id: client?.id,
                                        media_url: message.media?.url,
                                        media_type: message.type,
                                        mime_type: message.media?.mimetype,
                                        metadata: {
                                            ai_transcription: message.ai_transcription,
                                            ai_analysis: message.ai_analysis,
                                            is_consultant: resolution.isConsultant,
                                            author: authorId,
                                            is_group: isGroup,
                                            user_type: leadInfo.userType,
                                            ...leadInfo
                                        }
                                    }
                                }
                            },
                            recommendation: `Yeni bir potansiyel müşteri algılandı! ${leadInfo.summary}`,
                            suggested_action: 'create_lead',
                            score: leadInfo.seriousnessScore || 0,
                            metadata: { ...leadInfo, authorId }, // Keep authorId in metadata
                            is_applied: false
                        }
                    });

                    // NEW: Phase 4 - Auto-move Pipeline
                    if (client) {
                        await pipelineService.autoTransitionClient(client, leadInfo);
                    }

                    socketService.emit('new_lead_recommendation', {
                        id: rec.id,
                        phone: chatId, // ALWAYS pointing to the conversation (Group or Bio)
                        authorId: authorId, // Pass author separately
                        name: isGroup ? `${resolvedName} (${chatId.split('@')[0]})` : resolvedName,
                        score: leadInfo.seriousnessScore,
                        summary: leadInfo.summary
                    });

                    // NEW: Phase 3 - Auto-create Demand
                    if (client && (leadInfo.budget || leadInfo.location || leadInfo.rooms)) {
                        try {
                            // Check if an active demand already exists for this client to avoid duplicates
                            const existingDemand = await prisma.demand.findFirst({
                                where: {
                                    client_id: client.id,
                                    OR: [
                                        { district: leadInfo.location },
                                        { rooms: leadInfo.rooms }
                                    ]
                                }
                            });

                            if (!existingDemand) {
                                console.log(`🎯 [AI-DEMAND] Auto-creating demand for client ${client.id} based on WhatsApp analysis.`);
                                await prisma.demand.create({
                                    data: {
                                        client_id: client.id,
                                        max_price: leadInfo.budget ? parseFloat(leadInfo.budget) : null,
                                        district: leadInfo.location || null,
                                        rooms: leadInfo.rooms || null,
                                        // We could also store more details in a notes field if Demand model had one, 
                                        // but for now we follow the schema.
                                    }
                                });

                                socketService.emit('notification', {
                                    type: 'success',
                                    title: 'Yeni Talep Oluşturuldu',
                                    message: `${client.name} için AI tarafından otomatik talep oluşturuldu.`,
                                    clientId: client.id
                                });
                            }
                        } catch (demandErr) {
                            console.error('[AI-DEMAND] Error auto-creating demand:', demandErr);
                        }
                    }
                }

                // 3. Update Client Mood/Sentiment if detected
                if (client && (leadInfo?.sentiment || leadInfo?.mood)) {
                    try {
                        await prisma.client.update({
                            where: { id: client.id },
                            data: {
                                last_sentiment: leadInfo.mood || leadInfo.sentiment,
                                sentiment_history: {
                                    push: {
                                        sentiment: leadInfo.sentiment,
                                        mood: leadInfo.mood,
                                        timestamp: new Date()
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error('[AI-ANALYSIS] Error updating sentiment:', e.message);
                    }
                }

                // 4. Competitor Intelligence: If it's an agent sharing a listing, catalog it
                if (leadInfo?.userType === 'agent' && leadInfo?.isPotentialLead && !resolution.isConsultant) {
                    console.log(`[COMPETITOR-INTEL] Agent ${resolvedName} sharing a listing. Cataloging...`);
                    try {
                        await prisma.property.upsert({
                            where: { external_id: `wa-agent-${message.id._serialized}` },
                            update: {
                                price: leadInfo.budget || 0,
                                rooms: leadInfo.rooms || null,
                                district: leadInfo.location || null,
                                last_scraped: new Date()
                            },
                            create: {
                                external_id: `wa-agent-${message.id._serialized}`,
                                title: `[DIŞ PORTFÖY] ${leadInfo.summary || 'Emlakçı Paylaşımı'}`,
                                price: leadInfo.budget || 0,
                                rooms: leadInfo.rooms || null,
                                district: leadInfo.location || null,
                                url: `https://wa.me/${authorId.split('@')[0]}`,
                                seller_name: resolvedName,
                                seller_phone: authorId,
                                seller_type: 'external_agent',
                                listing_type: leadInfo.intent === 'rent_out' ? 'rent' : 'sale',
                                description: messageContent,
                                is_primary: false,
                                status: 'active'
                            }
                        });
                    } catch (e) {
                        console.error('[COMPETITOR-INTEL] Error saving external property:', e.message);
                    }
                }

                // 5. Always save message to DB for history
                try {
                    await prisma.whatsAppMessage.upsert({
                        where: { whatsapp_id: message.id._serialized },
                        update: {
                            sender_name: message.fromMe ? 'Trio Emlak' : (isGroup ? (message._data?.notifyName || resolvedName) : (resolvedName || authorId)),
                            client_id: client?.id
                        },
                        create: {
                            whatsapp_id: message.id._serialized,
                            from: message.fromMe ? 'system' : chatId,
                            to: message.fromMe ? chatId : 'system',
                            content: messageContent,
                            sender_name: message.fromMe ? 'Trio Emlak' : (isGroup ? (message._data?.notifyName || resolvedName) : (resolvedName || authorId)),
                            timestamp: new Date(message.timestamp * 1000),
                            client_id: client?.id,
                            metadata: {
                                is_consultant: resolution.isConsultant,
                                author: authorId,
                                is_group: isGroup,
                                ai_transcription: message.ai_transcription,
                                ai_analysis: message.ai_analysis
                            }
                        }
                    });

                    if (aiResponse) {
                        // AI Response should go to the SAME CHAT (group or individual)
                        await prisma.whatsAppMessage.upsert({
                            where: { whatsapp_id: finalAiId || ('ai-' + Date.now()) },
                            update: {
                                content: aiResponse,
                                client_id: client?.id
                            },
                            create: {
                                whatsapp_id: finalAiId || ('ai-' + Date.now()),
                                from: 'system',
                                to: chatId, // ALWAYS use chatId (supports groups)
                                content: aiResponse,
                                metadata: {
                                    is_ai: true,
                                    target_author: authorId,
                                    properties: properties ? properties : undefined
                                },
                                timestamp: new Date(),
                                client_id: client?.id
                            }
                        });
                    }
                } catch (dbError) {
                    console.error('DB Error:', dbError);
                }
            } catch (error) {
                console.error('Error in handleMessage processing:', error);
            }
        } // Close if (!isConsultant)
    } finally {
        setTimeout(() => messageLocks.delete(lockKey), 2000);
    }
}

module.exports = {
    handleMessage,
    resolveSenderName
};
