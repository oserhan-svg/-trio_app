const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { addDemand, deleteClient } = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { clientSchema, demandSchema } = require('../utils/schemas');

// Protect all CRM routes
router.use(authenticateToken);

const interactionController = require('../controllers/interactionController');
const clientPropertyController = require('../controllers/clientPropertyController');

// IMPORTANT: Routes are matched in order. More specific patterns must come before generic ones.
// Routes with multiple segments (e.g., /:id/matches) must come before single-segment routes (/:id)

// Generic CRUD routes (list and create don't conflict)
router.get('/', clientController.getClients);
router.get('/recent-matches', clientController.getRecentMatches);
router.post('/', validate(clientSchema), clientController.createClient);

// Demand Routes (these use /demands/:id, not /:id/demands, so no conflict)
router.put('/demands/:id', validate(demandSchema), clientController.updateDemand);
router.delete('/demands/:id', clientController.deleteDemand);

// Interaction Routes (these use /interactions/:id, not /:id/interactions, so no conflict)
router.delete('/interactions/:id', interactionController.deleteInteraction);

// Client-specific routes with sub-paths (MUST come before /:id)
router.get('/:id/matches', clientController.getClientMatches);
router.get('/:id/interactions', interactionController.getInteractions);
router.post('/:id/interactions', interactionController.createInteraction);
router.get('/:id/properties', clientPropertyController.getClientProperties);
router.post('/:id/properties', clientPropertyController.updateClientPropertyStatus);
router.delete('/:id/properties/:propertyId', clientPropertyController.removeClientProperty);
router.post('/:id/demands', validate(demandSchema), addDemand);

// Generic single-client routes (MUST come after all /:id/* routes)
router.get('/:id', clientController.getClient); // Get single client with all relations
router.put('/:id', validate(clientSchema), clientController.updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
