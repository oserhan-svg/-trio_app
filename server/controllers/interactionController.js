const prisma = require('../db');
const { stripHtml } = require('../utils/sanitize');

// Get all interactions for a client (Ownership Validated by Middleware)
const getInteractions = async (req, res) => {
    const { id: clientId } = req.params;

    try {
        const interactions = await prisma.interaction.findMany({
            where: { client_id: parseInt(clientId) },
            orderBy: { date: 'desc' } // Newest first
        });
        res.json(interactions);
    } catch (error) {
        console.error('Get Interactions Error:', error);
        res.status(500).json({ error: 'Error fetching interactions' });
    }
};

// Create a new interaction (Ownership Validated by Middleware + XSS Sanitized)
const createInteraction = async (req, res) => {
    const { id: clientId } = req.params;
    let { type, content, date } = req.body; // type: 'call', 'meeting', 'note', etc.

    // Security: Sanitize content for XSS
    if (content) content = stripHtml(content);

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
        console.error('Create Interaction Error:', error);
        res.status(500).json({ error: 'Error creating interaction' });
    }
};

// Delete an interaction (Ownership Validated)
const deleteInteraction = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        // IDOR Check: Ensure consultant can only delete interactions from their own clients
        if (user.role !== 'admin') {
            const interaction = await prisma.interaction.findUnique({
                where: { id: parseInt(id) },
                include: { client: { select: { consultant_id: true } } }
            });

            if (!interaction) {
                return res.status(404).json({ error: 'Interaction not found.' });
            }

            if (interaction.client.consultant_id && interaction.client.consultant_id !== parseInt(user.id)) {
                return res.status(403).json({ error: 'Unauthorized: You do not have access to this interaction.' });
            }
        }

        await prisma.interaction.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Interaction deleted' });
    } catch (error) {
        console.error('Delete Interaction Error:', error);
        res.status(500).json({ error: 'Error deleting interaction' });
    }
};

module.exports = { getInteractions, createInteraction, deleteInteraction };
