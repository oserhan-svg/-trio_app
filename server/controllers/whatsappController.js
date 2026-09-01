const whatsappService = require('../services/whatsappService');
const prisma = require('../db');
const { Prisma } = require('@prisma/client');
const DiscoveryService = require('../services/DiscoveryService');
const matchingService = require('../services/matchingService');
const GroqService = require('../services/GroqService');
const socketService = require('../services/socketService');
const messageHandlerService = require('../services/messageHandlerService');
const pdfService = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

const getStatus = async (req, res) => {
    try {
        const status = whatsappService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const initialize = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'consultant') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        try {
            await whatsappService.initialize();

            // Set up message handler using the service
            whatsappService.setOnMessageCallback(async (message) => {
                try {
                    await messageHandlerService.handleMessage(message);
                } catch (error) {
                    console.error('Error handling WhatsApp message:', error);
                }
            });

            res.json({ message: 'WhatsApp client initialization started' });
        } catch (initError) {
            console.error('Initialization Error:', initError);
            res.status(500).json({ error: 'Failed to initialize WhatsApp: ' + initError.message });
        }
    } catch (error) {
        console.error('Route Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const reset = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'consultant') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await whatsappService.reset();
        res.json({ message: 'WhatsApp client reset and re-initializing' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getChats = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        let baseCondition = req.user.role === 'consultant' ?
            Prisma.sql`WHERE (c.consultant_id = ${req.user.id} OR c.consultant_id IS NULL OR c.id IS NULL)` :
            Prisma.sql`WHERE 1=1`;

        const chatSummaries = await prisma.$queryRaw`
            WITH LatestMessages AS (
                SELECT DISTINCT ON (partner)
                    CASE WHEN "from" = 'system' THEN "to" ELSE "from" END as partner,
                    id, content, timestamp, "from", "to", is_viewed, media_type, client_id, sender_name
                FROM whatsapp_messages
                ORDER BY partner, timestamp DESC
            )
            SELECT 
                lm.*,
                c.id as "clientId", c.name as "clientName", c.profile_pic_url as "profilePicUrl",
                c.ai_delegated, c.ai_summary, c.priority_score, c.last_intent_tag,
                c.last_sentiment, c.next_best_action, c.is_stale,
                (SELECT COUNT(*)::int FROM whatsapp_messages 
                 WHERE "from" = lm.partner AND "to" = 'system' AND is_viewed = false) as "unreadCount"
            FROM LatestMessages lm
            LEFT JOIN clients c ON (c.phone = lm.partner OR c.phone = split_part(lm.partner, '@', 1))
            ${baseCondition}
            ORDER BY lm.timestamp DESC
            LIMIT 100
        `;

        let result = chatSummaries.map(c => {
            let displayName = c.clientName;
            const isGroup = c.partner.endsWith('@g.us');
            if (!displayName || displayName === 'WhatsApp Grup' || displayName === c.partner || /^\d+$/.test(String(displayName).replace(/\D/g, ''))) {
                if (isGroup) displayName = c.partner.split('@')[0];
                else displayName = c.sender_name && !/^\d+$/.test(c.sender_name.replace(/\D/g, '')) ? c.sender_name : c.partner.split('@')[0];
            }
            return {
                phone: c.partner,
                name: displayName,
                profilePic: c.profilePicUrl,
                ai_delegated: c.ai_delegated || false,
                ai_summary: c.ai_summary,
                priority_score: c.priority_score || 0,
                last_intent_tag: c.last_intent_tag,
                last_sentiment: c.last_sentiment,
                clientId: c.clientId,
                next_best_action: c.next_best_action,
                is_stale: c.is_stale,
                unreadCount: c.unreadCount || 0,
                lastMessage: {
                    id: c.id,
                    content: c.content,
                    timestamp: c.timestamp,
                    from: c.from,
                    to: c.to,
                    is_viewed: c.is_viewed,
                    media_type: c.media_type
                }
            };
        });

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.phone.includes(term) ||
                (c.name && c.name.toLowerCase().includes(term)) ||
                (c.lastMessage.content && c.lastMessage.content.toLowerCase().includes(term))
            );
        }

        result.sort((a, b) => (new Date(b.lastMessage.timestamp).getTime() || 0) - (new Date(a.lastMessage.timestamp).getTime() || 0));
        res.json(result);
    } catch (error) {
        console.error('Fetch chats error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const { chatId, daysBack, startDate, endDate, before } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        let whereClause = req.user.role === 'consultant' ? {
            OR: [
                { client: { consultant_id: req.user.id } },
                { client: null },
                { client: { consultant_id: null } }
            ]
        } : {};

        if (chatId) {
            const chatFilter = { OR: [{ from: chatId }, { to: chatId }] };
            whereClause = req.user.role === 'consultant' ? { AND: [whereClause, chatFilter] } : chatFilter;
        }

        if (before) whereClause.timestamp = { lt: new Date(before) };
        else if (startDate && endDate) whereClause.timestamp = { gte: new Date(startDate), lte: new Date(endDate) };
        else if (daysBack) {
            const d = new Date(); d.setDate(d.getDate() - parseInt(daysBack)); d.setHours(0, 0, 0, 0);
            whereClause.timestamp = { gte: d };
        }

        const messages = await prisma.whatsAppMessage.findMany({
            where: whereClause,
            select: { id: true, from: true, to: true, content: true, timestamp: true, is_viewed: true, media_url: true, media_type: true, whatsapp_id: true, metadata: true, client_id: true },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: before || startDate ? 0 : skip
        });

        let clientMetadata = null;
        if (chatId && !chatId.includes('@g.us')) {
            clientMetadata = await prisma.client.findFirst({
                where: { phone: chatId },
                select: { id: true, name: true, phone: true, profile_pic_url: true, ai_delegated: true, ai_summary: true, priority_score: true, last_intent_tag: true, last_sentiment: true, next_best_action: true, is_stale: true }
            });
        }

        res.json({
            messages,
            client: clientMetadata,
            count: messages.length,
            hasMore: messages.length === limit,
            oldestLoaded: messages.length > 0 ? messages[messages.length - 1].timestamp : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const repairNames = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: { OR: [{ name: { contains: 'WhatsApp' } }, { name: { contains: 'Grup' } }] }
        });
        const allClients = await prisma.client.findMany();
        const numericClients = allClients.filter(c => /^\d+$/.test(c.name.replace(/\D/g, '')) && c.name.length > 5);
        const targets = [...new Set([...clients, ...numericClients])];

        if (targets.length === 0) return res.json({ message: 'Düzeltilecek müşteri kaydı bulunamadı.' });

        const status = whatsappService.getStatus();
        if (status.status !== 'ready') return res.status(400).json({ error: 'WhatsApp bağlı değil.' });

        (async () => {
            console.log(`🚀 [REPAIR-NAMES] Starting repair for ${targets.length} clients...`);
            let fixedCount = 0;
            for (const client of targets) {
                try {
                    const resolution = await messageHandlerService.resolveSenderName(client.phone, null, null);
                    if (resolution.name && resolution.name !== client.name && !resolution.name.includes('WhatsApp')) {
                        await prisma.client.update({ where: { id: client.id }, data: { name: resolution.name } });
                        fixedCount++;
                    }
                } catch (err) { console.error(`❌ [REPAIR-NAMES] Error for ${client.phone}:`, err.message); }
            }
            console.log(`✅ [REPAIR-NAMES] Finished. Fixed ${fixedCount} names.`);
            socketService.emit('notification', { type: 'success', message: `${fixedCount} müşterinin ismi WhatsApp verileri ile güncellendi.` });
        })();

        res.json({ message: `${targets.length} potansiyel kayıt incelenmek üzere sıraya alındı.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const syncExtension = async (req, res) => {
    try {
        const { partnerName, messages } = req.body;
        if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Geçersiz mesaj formatı' });

        console.log(`📥 [EXT-SYNC] Processing ${messages.length} from ${partnerName}`);

        for (const msg of messages) {
            const chatId = msg.chatId || (partnerName.includes('@') ? partnerName : null);
            if (!chatId) continue;
            const phoneNumber = chatId.split('@')[0];
            const isGroup = chatId.endsWith('@g.us');

            let client = await prisma.client.findFirst({ where: { phone: isGroup ? chatId : phoneNumber } });

            if (client && req.body.profilePicUrl && !client.profile_pic_url) {
                await prisma.client.update({ where: { id: client.id }, data: { profile_pic_url: req.body.profilePicUrl } });
            }

            await prisma.whatsAppMessage.upsert({
                where: { whatsapp_id: msg.id },
                update: { client_id: client?.id || undefined },
                create: {
                    whatsapp_id: msg.id,
                    from: msg.isOutgoing ? 'system' : chatId,
                    to: msg.isOutgoing ? chatId : 'system',
                    content: msg.content,
                    sender_name: msg.isOutgoing ? 'Trio Emlak' : (partnerName || phoneNumber),
                    timestamp: new Date(),
                    client_id: client?.id,
                    metadata: { is_group: isGroup, synced_via: 'extension' }
                }
            });

            // Note: Trigger AI logic if NOT outgoing logic needs to be handled via service ideally
        }

        socketService.emit('whatsapp_extension_sync', { partnerName, count: messages.length, timestamp: new Date() });
        res.json({ success: true, count: messages.length });
    } catch (error) {
        console.error('❌ [EXT-SYNC] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const suggestMatches = async (req, res) => {
    const { id } = req.params;
    try {
        const matches = await matchingService.findMatchesForClient(id);
        if (matches.length === 0) return res.json({ message: 'Eşleşen uygun portföy bulunamadı.' });

        const client = await prisma.client.findUnique({ where: { id: parseInt(id) }, select: { name: true, phone: true } });
        const topMatches = matches.slice(0, 3);
        const draft = await GroqService.generatePropertySuggestionDraft(topMatches, client.name);

        if (draft) {
            socketService.emit('whatsapp_draft', { phone: client.phone, draft: draft });
            res.json({ success: true, message: 'Öneri taslağı WhatsApp sekmesine gönderildi.' });
        } else {
            res.status(500).json({ error: 'Taslak oluşturulamadı.' });
        }
    } catch (error) {
        console.error('[SUGGEST-MATCHES] Error:', error);
        res.status(500).json({ error: 'Eşleşme önerisi sırasında hata oluştu.' });
    }
};

const getActiveRecommendations = async (req, res) => {
    try {
        const recommendations = await prisma.aIRecommendation.findMany({
            where: { is_applied: false, score: { gte: 50 } },
            orderBy: { created_at: 'desc' },
            take: 10,
            include: { message: { include: { client: { select: { id: true, name: true, phone: true, profile_pic_url: true, ai_summary: true } } } } }
        });
        const result = recommendations.map(rec => ({ ...rec, client: rec.message?.client, client_id: rec.message?.client_id }));
        res.json(result);
    } catch (error) {
        console.error('[AI-FEED] Error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
};

const bulkDiscover = async (req, res) => {
    try {
        DiscoveryService.discoverLeadsFromHistory()
            .then(r => console.log('✅ [BG-DISCOVERY] Success:', r))
            .catch(e => console.error('❌ [BG-DISCOVERY] Global Error:', e));
        res.json({ message: 'Detaylı müşteri taraması arka planda başlatıldı.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const syncChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const fullChatId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
        const messages = await whatsappService.getChatMessages(fullChatId, 100);
        const contact = await whatsappService.getContactWithWarming(fullChatId);
        const chat = await whatsappService.getChat(fullChatId);
        const isGroup = chat?.isGroup || fullChatId.endsWith('@g.us');
        const phoneNumber = isGroup ? null : fullChatId.split('@')[0];

        const resolution = await messageHandlerService.resolveSenderName(phoneNumber || fullChatId, contact, chat);
        const resolvedName = resolution.name;
        const profilePicUrl = await whatsappService.getProfilePicUrl(fullChatId);

        let client = await prisma.client.findFirst({ where: { phone: isGroup ? fullChatId : phoneNumber } });

        if (client) {
            const updates = {};
            if (profilePicUrl && client.profile_pic_url !== profilePicUrl) updates.profile_pic_url = profilePicUrl;

            const isNumericPlaceholder = /^\d+$/.test(String(client.name).replace(/\D/g, '')) && String(client.name).length > 5;
            const isCurrentPlaceholder = !client.name || client.name === 'WhatsApp Grup' || client.name === (phoneNumber || fullChatId) || isNumericPlaceholder;

            if (resolvedName && resolvedName !== 'WhatsApp Grup' && (client.name !== resolvedName || isCurrentPlaceholder)) {
                updates.name = resolvedName;
            }

            if (Object.keys(updates).length > 0) {
                await prisma.client.update({ where: { id: client.id }, data: updates });
            }

            // Link existing messages
            await prisma.whatsAppMessage.updateMany({
                where: { OR: [{ from: fullChatId }, { to: fullChatId }], client_id: null },
                data: { client_id: client.id }
            });
        } else if (profilePicUrl || (resolvedName && resolvedName !== (phoneNumber || fullChatId))) {
            client = await prisma.client.create({
                data: {
                    name: resolvedName || (isGroup ? `Grup ${fullChatId}` : `WhatsApp ${phoneNumber}`),
                    phone: isGroup ? fullChatId : phoneNumber,
                    type: isGroup ? 'group' : 'buyer',
                    profile_pic_url: profilePicUrl,
                    status: 'New'
                }
            });
        }

        if (messages.length > 0) {
            const messageIds = messages.map(m => m.id._serialized);
            const existingMessages = await prisma.whatsAppMessage.findMany({
                where: { whatsapp_id: { in: messageIds } },
                select: { whatsapp_id: true }
            });
            const existingIdsSet = new Set(existingMessages.map(m => m.whatsapp_id));

            for (const msg of messages) {
                if (!['chat', 'image', 'video', 'audio', 'document', 'ptt'].includes(msg.type)) continue;
                if (existingIdsSet.has(msg.id._serialized)) continue;

                let mediaData = null;
                if (msg.hasMedia) {
                    mediaData = await whatsappService.processMessageMedia(msg);
                }

                const authorId = isGroup ? (msg.author || msg.from).split('@')[0] : phoneNumber;
                const authorResolution = await messageHandlerService.resolveSenderName(authorId, null, null);

                await prisma.whatsAppMessage.create({
                    data: {
                        whatsapp_id: msg.id._serialized,
                        from: msg.fromMe ? 'system' : fullChatId,
                        to: msg.fromMe ? fullChatId : 'system',
                        content: msg.body,
                        sender_name: msg.fromMe ? 'Trio Emlak' : (isGroup ? (msg._data?.notifyName || authorResolution.name) : (resolvedName || phoneNumber)),
                        timestamp: new Date(msg.timestamp * 1000),
                        client_id: client?.id,
                        media_url: mediaData?.url,
                        media_type: mediaData?.type,
                        mime_type: mediaData?.mimetype,
                        metadata: {
                            is_consultant: authorResolution.isConsultant,
                            author: authorId,
                            is_group: isGroup
                        }
                    }
                });
            }
        }
        res.json({ message: `Chat sync complete.`, name: resolvedName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cleanupAndRepair = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const status = whatsappService.getStatus();
        if (status.status !== 'ready') return res.status(400).json({ error: 'WhatsApp is not connected' });

        console.log('[REPAIR] Starting comprehensive cleanup and repair...');
        const messagesToMigrate = await prisma.whatsAppMessage.findMany({
            where: { whatsapp_id: { contains: '@g.us' }, NOT: { OR: [{ from: { contains: '@g.us' } }, { to: { contains: '@g.us' } }] } }
        });

        let migratedCount = 0;
        // ⚡ Bolt: Execute database updates concurrently in chunks of 50 to resolve N+1 performance bottleneck without exhausting connection pool
        for (let i = 0; i < messagesToMigrate.length; i += 50) {
            const chunk = messagesToMigrate.slice(i, i + 50);
            await Promise.all(chunk.map(async (m) => {
                const match = m.whatsapp_id.match(/_([^@\s]+@g\.us)_/);
                if (match) {
                    await prisma.whatsAppMessage.update({
                        where: { id: m.id },
                        data: { from: m.from === 'system' ? 'system' : match[1], to: m.to === 'system' ? 'system' : match[1] }
                    });
                    migratedCount++;
                }
            }));
        }

        const waChats = await whatsappService.getChats();
        let clientUpdates = 0;
        let clientCreates = 0;

        for (const chat of waChats) {
            const chatId = chat.id._serialized;
            const isGroup = chat.isGroup;
            const phoneNumber = isGroup ? null : chat.id.user;

            const contact = await whatsappService.getContactWithWarming(chatId);
            const profilePicUrl = await whatsappService.getProfilePicUrl(chatId);
            const resolution = await messageHandlerService.resolveSenderName(phoneNumber || chatId, contact, chat);
            const bestName = resolution.name;

            const client = await prisma.client.findFirst({ where: { phone: isGroup ? chatId : phoneNumber } });

            if (client) {
                const updates = {};
                if (bestName && client.name !== bestName && bestName !== (phoneNumber || chatId)) updates.name = bestName;
                if (profilePicUrl && client.profile_pic_url !== profilePicUrl) updates.profile_pic_url = profilePicUrl;
                if (isGroup && client.type !== 'group') updates.type = 'group';

                if (Object.keys(updates).length > 0) {
                    await prisma.client.update({ where: { id: client.id }, data: updates });
                    clientUpdates++;
                }

                await prisma.whatsAppMessage.updateMany({
                    where: { OR: [{ from: isGroup ? chatId : phoneNumber }, { to: isGroup ? chatId : phoneNumber }], client_id: { not: client.id } },
                    data: { client_id: client.id }
                });
            } else if (bestName && bestName !== (phoneNumber || chatId)) {
                const newClient = await prisma.client.create({
                    data: {
                        name: bestName,
                        phone: isGroup ? chatId : phoneNumber,
                        type: isGroup ? 'group' : 'buyer',
                        profile_pic_url: profilePicUrl,
                        status: 'New'
                    }
                });
                await prisma.whatsAppMessage.updateMany({
                    where: { OR: [{ from: isGroup ? chatId : phoneNumber }, { to: isGroup ? chatId : phoneNumber }] },
                    data: { client_id: newClient.id }
                });
                clientCreates++;
            }
        }

        res.json({ success: true, migratedMessages: migratedCount, clientUpdates, clientCreates, message: 'Cleanup complete.' });
    } catch (error) {
        console.error('[REPAIR] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getRecommendations = async (req, res) => {
    try {
        const recommendations = await prisma.aIRecommendation.findMany({
            where: { is_applied: false, message: req.user.role === 'consultant' ? { client: { consultant_id: req.user.id } } : {} },
            include: { message: { include: { client: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const applyRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const recommendation = await prisma.aIRecommendation.findUnique({
            where: { id: parseInt(id) },
            include: { message: true }
        });

        if (!recommendation) return res.status(404).json({ error: 'Recommendation not found' });

        if (recommendation.suggested_action === 'create_lead' && recommendation.metadata) {
            const meta = recommendation.metadata;
            let phoneNumber = recommendation.message.from === 'system' ? recommendation.message.to : recommendation.message.from;
            if (recommendation.message.metadata && recommendation.message.metadata.is_group && recommendation.message.metadata.author) {
                phoneNumber = recommendation.message.metadata.author;
            }

            let client = await prisma.client.findFirst({ where: { phone: phoneNumber } });
            const resolution = await messageHandlerService.resolveSenderName(phoneNumber, null, null);
            const resolvedName = resolution.source !== 'whatsapp' ? resolution.name : (meta.name || resolution.name);

            if (!client) {
                let enrichedNotes = `AI Tarafından Önerilen Kayıt: ${meta.summary || ''}`;
                if (meta.occupation) enrichedNotes += `\nMeslek: ${meta.occupation}`;
                if (meta.source) enrichedNotes += `\nKaynak: ${meta.source}`;
                client = await prisma.client.create({
                    data: {
                        name: resolvedName,
                        phone: phoneNumber,
                        type: 'buyer',
                        status: 'New',
                        notes: enrichedNotes,
                        consultant_id: req.user.id
                    }
                });
            }

            if (client && (meta.location || meta.budget || meta.rooms)) {
                await prisma.demand.create({
                    data: {
                        client_id: client.id,
                        district: meta.location || null,
                        max_price: meta.budget ? parseFloat(meta.budget) : null,
                        rooms: meta.rooms || null
                    }
                });
            }

            await prisma.whatsAppMessage.updateMany({
                where: { OR: [{ from: phoneNumber }, { to: phoneNumber }] },
                data: { client_id: client.id }
            });
        }

        const updated = await prisma.aIRecommendation.update({ where: { id: parseInt(id) }, data: { is_applied: true } });

        if (recommendation.metadata) {
            GroqService.analyzeAndLearn({
                type: 'lead_conversion',
                content: recommendation.message.content,
                extracted_data: recommendation.metadata,
                timestamp: new Date()
            }).catch(e => console.error('Learning error:', e));
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { to, content } = req.body;
        await whatsappService.sendMessage(to, content);
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleAi = async (req, res) => {
    try {
        const { id } = req.params;
        const { ai_delegated } = req.body;
        if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Geçersiz Client ID' });

        const client = await prisma.client.update({
            where: { id: parseInt(id) },
            data: { ai_delegated }
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        let baseWhere = req.user.role === 'consultant' ? { client: { consultant_id: req.user.id } } : {};
        await prisma.whatsAppMessage.updateMany({
            where: { AND: [{ from: chatId }, { to: 'system' }, { is_viewed: false }, req.user.role === 'consultant' ? baseWhere : {}] },
            data: { is_viewed: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const testPing = (req, res) => res.json({ message: 'WhatsApp Router is Active' });

const getMessageDateRanges = async (req, res) => {
    try {
        const { chatId } = req.query;
        let whereClause = req.user.role === 'consultant' ? {
            OR: [{ client: { consultant_id: req.user.id } }, { client: null }, { client: { consultant_id: null } }]
        } : {};

        if (chatId) {
            const chatFilter = { OR: [{ from: chatId }, { to: chatId }] };
            whereClause = req.user.role === 'consultant' ? { AND: [whereClause, chatFilter] } : chatFilter;
        }

        const [oldestMessage, newestMessage, totalCount] = await Promise.all([
            prisma.whatsAppMessage.findFirst({ where: whereClause, orderBy: { timestamp: 'asc' }, select: { timestamp: true } }),
            prisma.whatsAppMessage.findFirst({ where: whereClause, orderBy: { timestamp: 'desc' }, select: { timestamp: true } }),
            prisma.whatsAppMessage.count({ where: whereClause })
        ]);

        if (!oldestMessage || !newestMessage) {
            return res.json({ chatId: chatId || 'all', totalCount: 0, oldestMessageDate: null, newestMessageDate: null, dateRanges: [] });
        }

        const messagesByDate = await prisma.$queryRaw`
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM whatsapp_messages
            WHERE ${chatId ? Prisma.sql`(from = ${chatId} OR to = ${chatId})` : Prisma.sql`1=1`}
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 60
        `;

        res.json({
            chatId: chatId || 'all',
            totalCount,
            oldestMessageDate: oldestMessage.timestamp,
            newestMessageDate: newestMessage.timestamp,
            dateRanges: messagesByDate.map(row => ({ date: row.date, messageCount: Number(row.count) }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const repairGroups = async (req, res) => {
    try {
        const chats = await whatsappService.client.getChats();
        const groups = chats.filter(c => c.isGroup);
        let updatedCount = 0;

        for (const chat of groups) {
            const jid = chat.id._serialized;
            const subject = chat.name || chat.groupMetadata?.subject;

            if (subject && subject !== 'WhatsApp Grup') {
                await prisma.client.upsert({
                    where: { phone: jid },
                    update: { name: subject, type: 'group' },
                    create: { name: subject, phone: jid, type: 'group', status: 'New' }
                });
                updatedCount++;
            }
        }
        res.json({ message: `Repaired ${updatedCount} group names.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDiagnosticHealth = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const health = await whatsappService.getHealthStatus();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const hardReset = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        console.log('🚨 [HARD-RESET] Initiating full WhatsApp data wipe and resync...');
        await prisma.aIRecommendation.deleteMany({});
        await prisma.whatsAppMessage.deleteMany({});
        await prisma.client.updateMany({ data: { ai_summary: null, last_intent_tag: null, last_sentiment: null, is_stale: true } });
        console.log('✅ [HARD-RESET] Database cleaned. Triggering sync...');
        res.json({ message: 'Hard reset initiated. Messages cleared. Syncing in background...' });
        const status = whatsappService.getStatus();
        if (status.status === 'ready') syncAllData(true);
    } catch (error) {
        console.error('Hard Reset Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const sync = async (req, res) => {
    try {
        const status = whatsappService.getStatus();
        if (status.status !== 'ready') return res.status(400).json({ error: 'WhatsApp is not connected' });
        console.log('Starting Optimized WhatsApp sync...');
        const chats = await whatsappService.getChats();
        // Trigger background sync logic here or call a helper
        syncAllData(false); // Using the helper
        res.json({ message: 'Sync started in background.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper for deep sync (kept local to controller for now)
async function syncAllData(isDeep = false) {
    try {
        const chats = await whatsappService.getChats();
        const targetChats = chats.slice(0, 150);
        for (let i = 0; i < targetChats.length; i += 5) {
            const batch = targetChats.slice(i, i + 5);
            await Promise.all(batch.map(async (chat) => {
                const chatId = chat.id._serialized;
                const isGroup = chat.isGroup;
                const phoneNumber = isGroup ? null : chat.id.user;
                const [contact, profilePicUrl] = await Promise.all([whatsappService.getContactWithWarming(chatId), whatsappService.getProfilePicUrl(chatId)]);
                const resolution = await messageHandlerService.resolveSenderName(phoneNumber || chatId, contact, chat);
                const resolvedName = resolution.name;

                let client = await prisma.client.findFirst({ where: { phone: (isGroup ? chatId : phoneNumber) } });
                if (client) {
                    const updates = { profile_pic_url: profilePicUrl || client.profile_pic_url, is_stale: false };
                    if (!isGroup) {
                        const isCurrentPlaceholder = !client.name || client.name.includes('WhatsApp') || /^\d+$/.test(client.name);
                        if (isCurrentPlaceholder && resolvedName && !resolvedName.includes('WhatsApp')) updates.name = resolvedName;
                    } else if (resolvedName && resolvedName !== client.name && resolvedName !== chatId) {
                        updates.name = resolvedName;
                    }
                    await prisma.client.update({ where: { id: client.id }, data: updates });
                }

                const messages = await chat.fetchMessages({ limit: isDeep ? 100 : 30 });
                for (const msg of messages) {
                    if (!['chat', 'image', 'video', 'audio', 'document', 'ptt'].includes(msg.type)) continue;
                    const authorId = isGroup ? (msg.author || msg.from).split('@')[0] : phoneNumber;
                    await prisma.whatsAppMessage.upsert({
                        where: { whatsapp_id: msg.id._serialized },
                        update: {},
                        create: {
                            whatsapp_id: msg.id._serialized,
                            from: msg.fromMe ? 'system' : chatId,
                            to: msg.fromMe ? chatId : 'system',
                            content: msg.body,
                            sender_name: msg.fromMe ? 'Trio Emlak' : (isGroup ? (msg._data?.notifyName || resolvedName) : (resolvedName || phoneNumber)),
                            timestamp: new Date(msg.timestamp * 1000),
                            client_id: client?.id,
                            metadata: { author: authorId, is_group: isGroup }
                        }
                    });
                }
            }));
            const progress = Math.min(100, Math.round(((i + 5) / targetChats.length) * 100));
            socketService.emit('whatsapp_sync_progress', { progress, current: i + 5, total: targetChats.length });
        }
    } catch (e) {
        console.error('Deep sync failed:', e);
    }
}

const sendPropertyPdf = async (req, res) => {
    try {
        const { id } = req.params; // Property ID
        const { phone } = req.body; // Target phone number (e.g. 905551234567@c.us)

        if (!phone) {
            return res.status(400).json({ error: 'Target phone number is required' });
        }

        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Generate PDF
        const pdfBuffer = await pdfService.generatePropertyFlyer(property);
        if (!pdfBuffer) {
            return res.status(500).json({ error: 'PDF generation failed' });
        }

        // Save temporarily to send via WhatsApp (library usually needs path)
        const tempPath = path.join(__dirname, `../../temp/flyer_${property.id}_${Date.now()}.pdf`);

        // Ensure temp dir exists
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        fs.writeFileSync(tempPath, pdfBuffer);

        // Send logic
        const { MessageMedia } = require('whatsapp-web.js');
        const media = MessageMedia.fromFilePath(tempPath);

        // Use whatsappService to send (assuming instance is available globally or imported)
        // whatsappController usually uses whatsappService internally or imports it.
        // Let's check imports. it imports: const whatsappService = require('../services/whatsappService');

        await whatsappService.client.sendMessage(phone, media, {
            caption: `📄 *${property.title}* - Detaylı Portföy Sunumu ektedir.`
        });

        // Cleanup
        fs.unlinkSync(tempPath);

        res.json({ success: true, message: 'PDF sent successfully' });
    } catch (error) {
        console.error('Send PDF Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStatus,
    initialize,
    reset,
    getChats,
    getMessages,
    repairNames,
    syncExtension,
    suggestMatches,
    getActiveRecommendations,
    bulkDiscover,
    markAsRead,
    syncChat,
    cleanupAndRepair,
    getRecommendations,
    applyRecommendation,
    sendMessage,
    toggleAi,
    testPing,
    getMessageDateRanges,
    repairGroups,
    getDiagnosticHealth,
    hardReset,
    hardReset,
    sync,
    sendPropertyPdf
};
