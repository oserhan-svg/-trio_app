const prisma = require('../db');
const { findMatchesForClient, calculateMatchScore } = require('../services/matchingService');
const { jsonBigInt } = require('../utils/responseHelper');
const { stripHtml } = require('../utils/sanitize');

// Get matches for a client
const getClientMatches = async (req, res) => {
    const { id } = req.params;
    try {
        const matches = await findMatchesForClient(id);
        jsonBigInt(res, matches);
    } catch (error) {
        console.error('Matching Error:', error);
        res.status(500).json({ error: 'Error finding matches' });
    }
};

const getRecentMatches = async (req, res) => {
    try {
        const user = req.user;
        const matches = await prisma.clientProperty.findMany({
            where: {
                status: 'concierge',
                client: user.role !== 'admin' ? { consultant_id: user.id } : {}
            },
            include: {
                client: true,
                property: true
            },
            orderBy: { added_at: 'desc' },
            take: 10
        });
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
        let where = {};

        // RBAC: Consultants can only see their own clients OR unassigned clients
        if (user.role !== 'admin') {
            where = {
                OR: [
                    { consultant_id: user.id },
                    { consultant_id: null }
                ]
            };
        }

        console.log('Fetching clients for user:', user.id, 'Role:', user.role);
        console.log('Query Where:', JSON.stringify(where));

        const clients = await prisma.client.findMany({
            where,
            include: { demands: true, consultant: { select: { email: true } } }, // Include consultant info
            orderBy: { created_at: 'desc' }
        });
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Error fetching clients' });
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
        res.json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Error creating client' });
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
    let { min_price, max_price, rooms, district, neighborhood } = req.body;

    // Sanitize prices: convert "" to null
    if (min_price === '') min_price = null;
    if (max_price === '') max_price = null;

    try {
        const demand = await prisma.demand.create({
            data: {
                client_id: parseInt(id),
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                rooms,
                district,
                neighborhood
            }
        });
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
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Error updating client' });
    }
};

// Update a demand
const updateDemand = async (req, res) => {
    const { id } = req.params;
    let { min_price, max_price, rooms, district, neighborhood } = req.body;

    // Sanitize prices
    if (min_price === '') min_price = null;
    if (max_price === '') max_price = null;

    try {
        const demand = await prisma.demand.update({
            where: { id: parseInt(id) },
            data: {
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                rooms,
                district,
                neighborhood
            }
        });
        res.json(demand);
    } catch (error) {
        res.status(500).json({ error: 'Error updating demand' });
    }
};

// Delete a demand
const deleteDemand = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.demand.delete({ where: { id: parseInt(id) } });
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
    bulkCreateClients
};
