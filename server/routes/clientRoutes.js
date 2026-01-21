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
router.post('/bulk', clientController.bulkCreateClients);

// Demand Routes (these use /demands/:id, not /:id/demands, so no conflict)
router.put('/demands/:id', validate(demandSchema), clientController.updateDemand);
router.delete('/demands/:id', clientController.deleteDemand);

// Interaction Routes (these use /interactions/:id, not /:id/interactions, so no conflict)
router.delete('/interactions/:id', interactionController.deleteInteraction);

// PENDING CONTACT ROUTES (Aday Müşteri Havuzu)
// IMPORTANT: Must be before /:id routes to avoid conflict
const pendingController = require('../controllers/pendingContactController');
router.get('/pending/list', pendingController.getPendingContacts); // /api/clients/pending
router.post('/pending/approve/:id', pendingController.approveContact);
router.delete('/pending/:id', pendingController.deletePendingContact);
router.post('/pending/bulk-approve', pendingController.bulkApprove);
router.post('/pending/bulk-delete', pendingController.bulkDelete);

// Client-specific routes with sub-paths (MUST come before /:id)
router.get('/:id/matches', clientController.getClientMatches);
router.get('/:id/interactions', interactionController.getInteractions);
router.post('/:id/interactions', interactionController.createInteraction);
router.get('/:id/properties', clientPropertyController.getClientProperties);
router.post('/:id/properties', authenticateToken, clientController.addPropertyToClient);
router.delete('/:id/properties/:propertyId', authenticateToken, clientController.removePropertyFromClient);
router.delete('/:id/properties', authenticateToken, clientController.removeAllProperties); // Bulk remove
router.post('/:id/demands', validate(demandSchema), addDemand);

// Generic single-client routes (MUST come after all /:id/* routes)
// Generic single-client routes (MUST come after all /:id/* routes)
router.get('/:id', clientController.getClient); // Get single client with all relations
router.put('/:id', validate(clientSchema), clientController.updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
