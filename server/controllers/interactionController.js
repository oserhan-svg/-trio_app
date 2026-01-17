const prisma = require('../db');

// Get all interactions for a client
const getInteractions = async (req, res) => {
    const { clientId } = req.params;
    try {
        const interactions = await prisma.interaction.findMany({
            where: { client_id: parseInt(clientId) },
            orderBy: { date: 'desc' } // Newest first
        });
        res.json(interactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching interactions' });
    }
};

// Create a new interaction
const createInteraction = async (req, res) => {
    const { clientId } = req.params;
    const { type, content, date } = req.body; // type: 'call', 'meeting', 'note', etc.

    try {
        const interaction = await prisma.interaction.create({
            data: {
                client_id: parseInt(clientId),
                type,
                content,
                date: date ? new Date(date) : new Date()
            }
        });
        res.json(interaction);
    } catch (error) {
        res.status(500).json({ error: 'Error creating interaction' });
    }
};

// Delete an interaction
const deleteInteraction = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.interaction.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Interaction deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting interaction' });
    }
};

module.exports = { getInteractions, createInteraction, deleteInteraction };
