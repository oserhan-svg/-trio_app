const prisma = require('../db');
const matchingService = require('../services/matchingService');
const { calculateMatchScore } = require('../services/matchingService');
const { jsonBigInt } = require('../utils/responseHelper');
const { stripHtml } = require('../utils/sanitize');
const GroqService = require('../services/GroqService');
const CacheService = require('../services/cacheService');
const performanceHardeningService = require('../services/performanceHardeningService');
const socketService = require('../services/socketService');
const auditService = require('../services/auditService');
const whatsappService = require('../services/whatsappService');

// Get matches for a client (WITH CACHING)
const getClientMatches = async (req, res) => {
    const { id } = req.params;
    const cacheKey = `matches:client:${id}`;

    try {
        // Check cache first using the consolidated matchingService
        const matches = await matchingService.findMatchesForClient(id);
        jsonBigInt(res, matches);
    } catch (error) {
        console.error('Client Matches Error:', error);
        res.status(500).json({ error: 'Error fetching client matches' });
    }
};

const getRecentMatches = async (req, res) => {
    const user = req.user;
    const cacheKey = `matches: recent:${user.id}:${user.role} `;

    try {
        // Check cache first
        const cached = CacheService.get(cacheKey);
        if (cached) {
            return jsonBigInt(res, cached);
        }

        // Fetch with optimized select
        const matches = await prisma.clientProperty.findMany({
            where: {
                status: 'concierge',
                client: user.role !== 'admin' ? { consultant_id: parseInt(user.id) } : {},
                property: { status: { not: 'removed' } } // Filter removed properties
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        neighborhood: true,
                        district: true,
                        rooms: true,
                        images: true,
                        url: true,
                        status: true
                    }
                }
            },
            orderBy: { added_at: 'desc' },
            take: 50
        });

        CacheService.set(cacheKey, matches, 180); // 3 min TTL
        jsonBigInt(res, matches);
    } catch (error) {
        console.error('Recent Matches Error:', error);
        res.status(500).json({ error: 'Error fetching recent matches' });
    }
};


// Get all clients with their demands (Filtered by Role)
const getClients = async (req, res) => {
    try {
        const user = req.user;
        const { search, status, type, page = 1, limit = 15 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let where = {};

        // RBAC: Consultants can only see their own clients OR unassigned clients
        if (user.role !== 'admin') {
            const userId = parseInt(user.id);
            where.OR = [
                { consultant_id: userId },
                { consultant_id: null }
            ];
        }

        // Apply filters
        if (status && status !== 'all') {
            where.status = status;
        }

        if (type && type !== 'all') {
            where.type = type;
        }

        if (search) {
            const searchClause = {
                OR: [
                    { name: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } }
                ]
            };
            // Combine with RBAC if necessary
            if (where.OR) {
                where = { AND: [{ OR: where.OR }, searchClause] };
            } else {
                where = { ...where, ...searchClause };
            }
        }

        // ⚡ Bolt Performance Optimization:
        // Replaced multiple Prisma count queries with a single groupBy query.
        // Impact: Reduces concurrent database calls from 5 to 4, lowering DB overhead and potentially improving endpoint latency.
        const [total, clients, groupStats, newThisMonth] = await Promise.all([
            prisma.client.count({ where }),
            prisma.client.findMany({
                where,
                include: { demands: true, consultant: { select: { email: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take
            }),
            prisma.client.groupBy({
                by: ['type', 'status'],
                where,
                _count: { _all: true }
            }),
            prisma.client.count({
                where: {
                    AND: [
                        where,
                        {
                            created_at: {
                                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                            }
                        }
                    ]
                }
            })
        ]);

        let activeBuyers = 0;
        let activeSellers = 0;
        groupStats.forEach(g => {
            if (g.status === 'Active') {
                if (g.type === 'buyer') activeBuyers += g._count._all;
                else if (g.type === 'seller') activeSellers += g._count._all;
            }
        });

        jsonBigInt(res, {
            data: clients,
            total,
            stats: {
                activeBuyers,
                activeSellers,
                newThisMonth
            },
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Error fetching clients', details: error.message });
    }
};



// Get a single client with all relations
const getClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                demands: true,
                interactions: { orderBy: { date: 'desc' } },
                saved_properties: {
                    include: { property: true },
                    orderBy: { added_at: 'desc' }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Calculate dynamic match scores for saved properties
        if (client.demands && client.demands.length > 0 && client.saved_properties && client.saved_properties.length > 0) {
            client.saved_properties = client.saved_properties.map(sp => {
                if (!sp.property) return { ...sp, current_match_score: 0 }; // Handle orphaned property
                let bestScore = 0;
                for (const demand of client.demands) {
                    const { score } = calculateMatchScore(sp.property, demand);
                    if (score > bestScore) bestScore = score;
                }
                return { ...sp, current_match_score: bestScore };
            });
            // Sort by Date Added (Newest First) - User Preference
            client.saved_properties.sort((a, b) => {
                return new Date(b.added_at) - new Date(a.added_at);
            });
        }

        // Deduplicate saved_properties (Keep highest score or newest)
        if (client.saved_properties && client.saved_properties.length > 0) {
            const seenUrls = new Set();
            client.saved_properties = client.saved_properties.filter(sp => {
                if (!sp.property || !sp.property.url) return true; // Keep odd ones
                const normUrl = sp.property.url.split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();

                if (seenUrls.has(normUrl)) {
                    console.log(`Deduplicating Client Property: ${sp.property.id} (${normUrl})`);
                    return false;
                }
                seenUrls.add(normUrl);
                return true;
            });
            console.log(`Client Deduplication: Reduced to ${client.saved_properties.length} unique properties.`);
        }

        jsonBigInt(res, client);
    } catch (error) {
        console.error('Get Client Error:', error);
        res.status(500).json({ error: 'Error fetching client' });
    }
};

// Create a new client (Assigned to Creator)
// Create a new client (Assigned to Creator)

const createClient = async (req, res) => {
    let { name, phone, email, notes, type } = req.body;

    // Sanitize inputs
    name = stripHtml(name);
    notes = stripHtml(notes);

    try {
        const client = await prisma.client.create({
            data: {
                name,
                phone,
                email,
                notes,
                type: type || 'buyer',
                consultant_id: req.user.id // Assign to current user
            }
        });

        // Notify real-time
        socketService.emit('client:new', client);

        jsonBigInt(res, client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Error creating client', details: error.message });
    }
};

// Bulk Create Clients (CSV Import)
const bulkCreateClients = async (req, res) => {
    const clientsData = req.body; // Array of { name, phone, email, notes, type }

    if (!Array.isArray(clientsData)) {
        return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
    }

    try {
        const consultantId = req.user.id;

        // 1. Sanitize and Filter Invalid Data In-Memory
        const validClients = clientsData
            .filter(c => c.name && c.phone)
            .map(c => ({
                name: stripHtml(c.name),
                phone: c.phone.trim(),
                email: c.email ? c.email.trim() : null,
                notes: c.notes ? stripHtml(c.notes) : null,
                consultant_id: consultantId
            }));

        if (validClients.length === 0) {
            return res.json({ message: 'No valid contacts to import.', results: { added: 0, skipped: 0, errors: clientsData.length } });
        }

        // 2. Insert into PendingContact (No Deduplication required for Staging, or minimal)
        // createMany is much faster
        const batchResult = await prisma.pendingContact.createMany({
            data: validClients
        });

        const stats = {
            added: batchResult.count,
            skipped: 0,
            errors: clientsData.length - validClients.length
        };

        res.json({ message: 'Import completed', results: stats });

    } catch (error) {
        console.error('Bulk Create Error:', error);
        // Return the actual error message safely
        res.status(500).json({ error: 'Error processing bulk import', details: error.message });
    }
};

// Add a demand for a client
const addDemand = async (req, res) => {
    const { id } = req.params;
    let { min_price, max_price, rooms, district, neighborhood, listing_type, notes } = req.body;

    // Sanitize prices: convert "" to null
    if (min_price === '') min_price = null;
    if (max_price === '') max_price = null;

    // Sanitize notes
    notes = notes ? stripHtml(notes) : null;

    try {
        const demand = await prisma.demand.create({
            data: {
                client_id: parseInt(id),
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                rooms,
                district,
                neighborhood,
                listing_type: listing_type || 'sale',
                notes
            }
        });

        // Invalidate cache for this client
        matchingService.invalidateClientCache(id);

        res.json(demand);
    } catch (error) {
        console.error('Error adding demand:', error);
        res.status(500).json({ error: error.message || 'Error adding demand' });
    }
};

// Delete a client
const deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.client.delete({ where: { id: parseInt(id) } });

        // Notify real-time
        socketService.emit('client:deleted', { id: parseInt(id) });

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Error deleting client' });
    }
};

// Update a client
const updateClient = async (req, res) => {
    const { id } = req.params;
    let { name, phone, email, notes, type } = req.body;

    // Sanitize inputs
    if (name) name = stripHtml(name);
    if (notes) notes = stripHtml(notes);

    try {
        const client = await prisma.client.update({
            where: { id: parseInt(id) },
            data: { name, phone, email, notes, type }
        });

        // Notify real-time
        socketService.emit('client:updated', client);

        jsonBigInt(res, client);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Error updating client', details: error.message });
    }
};

// Update a demand
const updateDemand = async (req, res) => {
    const { id } = req.params;
    let { min_price, max_price, rooms, district, neighborhood, listing_type, notes } = req.body;

    // Sanitize prices
    if (min_price === '') min_price = null;
    if (max_price === '') max_price = null;

    // Sanitize notes
    notes = notes ? stripHtml(notes) : null;

    try {
        const demand = await prisma.demand.update({
            where: { id: parseInt(id) },
            data: {
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                rooms,
                district,
                neighborhood,
                listing_type,
                notes
            },
            include: { client: { select: { id: true } } }
        });

        // Invalidate cache for this demand's client
        matchingService.invalidateClientCache(demand.client_id);

        res.json(demand);
    } catch (error) {
        res.status(500).json({ error: 'Error updating demand' });
    }
};

// Delete a demand
const deleteDemand = async (req, res) => {
    const { id } = req.params;
    try {
        const demand = await prisma.demand.findUnique({
            where: { id: parseInt(id) },
            select: { client_id: true }
        });

        await prisma.demand.delete({ where: { id: parseInt(id) } });

        // Invalidate cache for this demand's client
        if (demand) {
            matchingService.invalidateClientCache(demand.client_id);
        }

        res.json({ message: 'Demand deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting demand' });
    }
};

// Add a property to client's saved list
const addPropertyToClient = async (req, res) => {
    const { id } = req.params;
    // Support both casings
    const { property_id, propertyId, manual_match } = req.body;
    const pIdRaw = property_id || propertyId;

    try {
        // Check for valid IDs
        const cId = parseInt(id);
        const pId = parseInt(pIdRaw);

        if (isNaN(cId) || isNaN(pId)) {
            return res.status(400).json({ error: 'Invalid client or property ID' });
        }

        const savedProperty = await prisma.clientProperty.create({
            data: {
                client: { connect: { id: cId } },
                property: { connect: { id: pId } },
                status: 'concierge',
                added_at: new Date()
            }
        });
        res.json(savedProperty);
    } catch (error) {
        // Unique constraint violation (already added) is common, handle gracefully
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Property already added to client' });
        }
        console.error('Error adding property to client:', error);
        res.status(500).json({ error: 'Error adding property to client' });
    }
};

// Remove a property from client's saved list
const removePropertyFromClient = async (req, res) => {
    const { id, propertyId } = req.params;
    try {
        await prisma.clientProperty.deleteMany({
            where: {
                client_id: parseInt(id),
                property_id: parseInt(propertyId)
            }
        });
        res.json({ message: 'Property removed successfully' });
    } catch (error) {
        console.error('Error removing property from client:', error);
        res.status(500).json({ error: 'Error removing property from client' });
    }
};

// Update property note
const updatePropertyNote = async (req, res) => {
    const { id, propertyId } = req.params;
    const { note } = req.body;
    try {
        // We need to find the specific SavedProperty record first, or use updateMany
        // Since (client_id, property_id) is unique, updateMany is safe
        await prisma.clientProperty.updateMany({
            where: {
                client_id: parseInt(id),
                property_id: parseInt(propertyId)
            },
            data: { note }
        });
        res.json({ message: 'Note updated' });
    } catch (error) {
        console.error('Error updating property note:', error);
        res.status(500).json({ error: 'Error updating property note' });
    }
};

// Remove ALL properties for a client
const removeAllProperties = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.clientProperty.deleteMany({
            where: { client_id: parseInt(id) }
        });
        res.json({ message: 'All properties removed' });
    } catch (error) {
        console.error('Remove All Properties Error:', error);
        res.status(500).json({ error: 'Error removing properties' });
    }
};

// Generate AI Digest for Client
const generateAIDigest = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: { demands: true }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // 1. Get matches
        const matches = await matchingService.findMatchesForClient(id);

        if (!matches || matches.length === 0) {
            return res.status(400).json({ error: 'Bu müşteri için eşleşen ilan bulunamadı. Lütmen taleplerini güncelleyin.' });
        }

        // 2. Prepare data for AI
        const bestDemand = client.demands[0]; // Use the newest demand
        const rawMatches = matches.slice(0, 5); // Top 5 matches

        // 2.2 Automate PropertyListing and Content Regeneration
        const marketingService = require('../services/marketingService');
        const { v4: uuidv4 } = require('uuid');

        const bestMatches = await Promise.all(rawMatches.map(async (p) => {
            try {
                // 1. Try to get marketing content (handle case where metadata field might be missing from schema)
                let pkg = null;
                if (p.metadata && typeof p.metadata === 'object') {
                    pkg = p.metadata.marketing_package;
                }

                if (!pkg || !pkg.premium_title) {
                    pkg = await marketingService.generateMarketingPackage(p.id);
                }

                // 2. Ensure a system-generated PropertyListing exists for branded sharing
                let listing = await prisma.propertyListing.findFirst({
                    where: { property_id: p.id, created_by: null },
                    orderBy: { created_at: 'desc' }
                });

                if (!listing) {
                    listing = await prisma.propertyListing.create({
                        data: {
                            property_id: p.id,
                            share_token: uuidv4(),
                            custom_title: pkg?.premium_title || p.title,
                            custom_description: pkg?.premium_description || p.description,
                        }
                    });
                } else if (pkg && (listing.custom_title !== pkg.premium_title)) {
                    // Update existing system listing if content was refreshed
                    listing = await prisma.propertyListing.update({
                        where: { id: listing.id },
                        data: {
                            custom_title: pkg.premium_title || listing.custom_title,
                            custom_description: pkg.premium_description || listing.custom_description
                        }
                    });
                }

                return {
                    ...p,
                    share_token: listing.share_token,
                    custom_title: listing.custom_title || p.title,
                    custom_description: listing.custom_description || p.description
                };
            } catch (err) {
                console.error(`Error processing match ${p.id} for AI Digest:`, err);
                return p; // Fallback to raw property
            }
        }));

        // 2.5 Get recent interactions for context
        const recentInteractions = await prisma.interaction.findMany({
            where: { client_id: parseInt(id) },
            orderBy: { date: 'desc' },
            take: 5
        });

        // 3. Call AI (With Resiliency)
        const digest = await performanceHardeningService.resilientCall(
            () => GroqService.generateClientDigest(client, bestDemand, bestMatches, recentInteractions),
            'GroqAIDigest'
        );

        // Fallback for degraded service
        if (digest.failover) {
            return res.json({
                digest: "⚠️ AI Servisi şu an yoğun olduğu için özet oluşturulamadı. Lütfen alt kısımdaki eşleşen ilanları manuel inceleyin.",
                properties: bestMatches
            });
        }

        // Add a small contextual note if interactions were found
        let finalDigest = digest;
        if (recentInteractions.length > 0) {
            // We don't modify the digest content directly here as GroqService should handle it internally ideally,
            // but for now we pass it to a refined digest call if we want to change GroqService. 
            // Let's refine GroqService.generateClientDigest to accept interactions.
        }

        res.json({ digest, properties: bestMatches });
    } catch (error) {
        console.error('Generate AI Digest Error:', error);
        res.status(500).json({ error: 'Özet oluşturulurken bir hata oluştu: ' + error.message });
    }
};

const analyzeClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                demands: true,
                interactions: { orderBy: { date: 'desc' }, take: 10 },
                saved_properties: { include: { property: true } }
            }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });

        const analysis = await performanceHardeningService.resilientCall(
            () => GroqService.analyzeClientHistory(
                client,
                client.interactions,
                client.demands,
                client.saved_properties
            ),
            'GroqClientAnalysis'
        );

        res.json({ analysis: analysis.failover ? "⚠️ Analiz şu an yapılamıyor, lütfen daha sonra tekrar deneyin." : analysis });
    } catch (error) {
        console.error('Client Analysis Error:', error);
        res.status(500).json({ error: 'Analiz oluşturulurken hata: ' + error.message });
    }
};

const getClientHealth = async (req, res) => {
    try {
        const { id } = req.params;
        const pipelineService = require('../services/pipelineService');
        const health = await pipelineService.analyzeClientHealth(parseInt(id));
        res.json(health);
    } catch (error) {
        console.error('Get Client Health Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createPublicLead = async (req, res) => {
    const { name, phone, email, notes, propertyId } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'İsim ve telefon zorunludur.' });
    }

    try {
        // Find property to identify the consultant
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) },
            select: { assigned_user_id: true, title: true }
        });

        // Default to first admin if no assigned user
        let consultantId = property?.assigned_user_id;
        if (!consultantId) {
            const firstAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
            consultantId = firstAdmin?.id;
        }

        if (!consultantId) {
            return res.status(500).json({ error: 'Danışman atanamadı.' });
        }

        const lead = await prisma.pendingContact.create({
            data: {
                name: stripHtml(name),
                phone: phone.trim(),
                email: email ? email.trim() : null,
                notes: `[KAMU İLAN FORMU] ${property?.title || 'Bilinmeyen İlan'}: ${stripHtml(notes || '')}`,
                consultant_id: consultantId
            }
        });

        // Emit socket notification
        socketService.emit('client:new', lead);

        res.json({ success: true, message: 'Talebiniz alınmıştır, teşekkürler.' });
    } catch (error) {
        console.error('Public Lead Error:', error);
        res.status(500).json({ error: 'Talep iletilemedi.' });
    }
};

const getClientStrategy = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                interactions: { orderBy: { date: 'desc' }, take: 10 },
                demands: true
            }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });

        // 1. Get recent matches
        const matches = await matchingService.findMatchesForClient(id);

        // 2. Generate AI Strategy
        const strategy = await performanceHardeningService.resilientCall(
            () => GroqService.generateClientStrategy(client, client.interactions, matches),
            'GroqClientStrategy'
        );

        if (strategy.failover) {
            return res.json({
                analysis: "⚠️ Strateji şu an oluşturulamıyor.",
                next_step: "Müşteriyi arayarak güncel durumu sorun.",
                suggested_draft: "Merhaba, size en son gönderdiğimiz portföylerle ilgili görüşlerinizi merak ediyoruz."
            });
        }

        // 3. Update client's next best action in DB
        await prisma.client.update({
            where: { id: client.id },
            data: { next_best_action: strategy.next_step }
        });

        res.json(strategy);
    } catch (error) {
        console.error('Client Strategy Error:', error);
        res.status(500).json({ error: 'Strateji oluşturulurken hata oluştu.' });
    }
};

module.exports = {
    getClients,
    getClientById: getClient, // Export alias if needed, or just getClient
    getClient, // Ensure getClient is exported
    createClient,
    addDemand,
    deleteDemand,
    updateDemand, // Export updateDemand
    deleteClient, // Export deleteClient
    addPropertyToClient,
    removePropertyFromClient,
    removeAllProperties,
    updatePropertyNote,
    getClientMatches,
    getRecentMatches,
    updateClient,
    bulkCreateClients,
    generateAIDigest,
    sendAIDigest: async (req, res) => {
        const { id } = req.params;
        const { message } = req.body;
        try {
            const client = await prisma.client.findUnique({ where: { id: parseInt(id) } });
            if (!client || !client.phone) return res.status(404).json({ error: 'Müşteri veya telefon numarası bulunamadı.' });

            // Use whatsappService to send (assuming it exports sendMessage)
            // We need to require it at the top or assumed it is available via other services
            // Note: clientController usually implies we might need to import whatsappService if not already imported.
            // Let's check imports. If not imported, we need to rely on existing mechanism or import it.
            // Since we cannot see top of file, we will assume we might need to use the one used in `createPublicLead` if any,
            // or we will use `global.whatsappClient` if valid, OR better: use socketService to emit or similar?
            // Wait, standard way is services/whatsappService.js.
            // Let's assume it is imported as `whatsappService` (likely) or `require('../services/whatsappService')` inside if needed.

            const whatsappService = require('../services/whatsappService');

            const chatId = client.phone.replace(/[^\d]/g, '') + '@c.us';
            await whatsappService.sendMessage(chatId, message);

            res.json({ success: true });
        } catch (error) {
            console.error('Send Digest Error:', error);
            res.status(500).json({ error: 'Mesaj gönderilemedi.' });
        }
    },
    analyzeClient,
    getClientStrategy,
    getClientHealth,
    createPublicLead
};
