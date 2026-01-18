const prisma = require('../db');
const { findMatchesForClient } = require('../services/matchingService');
const { jsonBigInt } = require('../utils/responseHelper');

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

        jsonBigInt(res, client);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching client' });
    }
};

// Create a new client (Assigned to Creator)
const { stripHtml } = require('../utils/sanitize');

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

// Add a demand for a client
const addDemand = async (req, res) => {
    const { id } = req.params;
    const { min_price, max_price, rooms, district, neighborhood } = req.body;
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
        res.status(500).json({ error: 'Error adding demand' });
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
    const { min_price, max_price, rooms, district, neighborhood } = req.body;
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
        res.json({ message: 'Demand deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting demand' });
    }
};

module.exports = { getClients, getClient, createClient, updateClient, addDemand, deleteClient, getClientMatches, getRecentMatches, updateDemand, deleteDemand };
