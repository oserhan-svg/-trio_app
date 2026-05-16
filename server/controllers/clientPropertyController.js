const prisma = require('../db');

// Get saved properties for a client
const getClientProperties = async (req, res) => {
    const { clientId } = req.params;
    try {
        const properties = await prisma.clientProperty.findMany({
            where: { client_id: parseInt(clientId) },
            include: { property: true },
            orderBy: { added_at: 'desc' }
        });

        // Handle BigInt serialization for property prices/ids
        const safeProperties = JSON.parse(JSON.stringify(properties, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(safeProperties);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching client properties: ' + error.message });
    }
};

// Add or Update a property status for a client
const updateClientPropertyStatus = async (req, res) => {
    // Correct parameter: 'id' from route definition /:id/properties
    // We check both clientId and id for safety, though id is the correct one from route
    const clientId = req.params.clientId || req.params.id;


    const { propertyId, status, notes } = req.body;
    // status: 'suggested', 'liked', 'rejected', 'offered'

    try {
        const record = await prisma.clientProperty.upsert({
            where: {
                client_id_property_id: {
                    client_id: parseInt(clientId),
                    property_id: parseInt(propertyId)
                }
            },
            update: { status, notes },
            create: {
                client_id: parseInt(clientId),
                property_id: parseInt(propertyId),
                status
            }
        });
        res.json(record);
    } catch (error) {
        console.error('Update Property Status Error:', error);

        const errorMessage = error.message || 'Error updating property status';
        res.status(500).json({ error: errorMessage });
    }
};

// Remove property from client list
const removeClientProperty = async (req, res) => {
    const clientId = req.params.clientId || req.params.id;
    const { propertyId } = req.params;

    try {
        await prisma.clientProperty.delete({
            where: {
                client_id_property_id: {
                    client_id: parseInt(clientId),
                    property_id: parseInt(propertyId)
                }
            }
        });
        res.json({ message: 'Property removed from client list' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing property' });
    }
};

module.exports = { getClientProperties, updateClientPropertyStatus, removeClientProperty };
