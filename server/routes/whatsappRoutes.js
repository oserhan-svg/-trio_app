const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken, extensionAuth } = require('../middleware/authMiddleware');
const { aiRateLimiter, heavyAiRateLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * WhatsApp Router
 * Refactored to delegate logic to whatsappController and messageHandlerService
 */

// Status & Health
router.get('/status', authenticateToken, whatsappController.getStatus);
router.get('/diagnostics', authenticateToken, whatsappController.getDiagnosticHealth);
router.get('/test-ping', whatsappController.testPing);

// Initialization & Management
router.post('/initialize', authenticateToken, whatsappController.initialize);
router.post('/reset', authenticateToken, whatsappController.reset);
router.post('/hard-reset', authenticateToken, whatsappController.hardReset);

// Chats & Messages
router.get('/chats', authenticateToken, whatsappController.getChats);
router.get('/messages', authenticateToken, whatsappController.getMessages);
router.get('/messages/date-ranges', authenticateToken, whatsappController.getMessageDateRanges);
router.post('/chats/:chatId/read', authenticateToken, whatsappController.markAsRead);
router.post('/sync-chat/:chatId', authenticateToken, whatsappController.syncChat);
router.post('/send', authenticateToken, whatsappController.sendMessage);

// Sync Operations
router.post('/sync', authenticateToken, whatsappController.sync);
router.post('/extension-sync', extensionAuth, whatsappController.syncExtension);

// Maintenance
router.post('/repair-names', authenticateToken, whatsappController.repairNames);
router.post('/repair-groups', authenticateToken, whatsappController.repairGroups);
router.post('/cleanup-and-repair', authenticateToken, whatsappController.cleanupAndRepair);
router.post('/bulk-discover', authenticateToken, heavyAiRateLimiter, whatsappController.bulkDiscover);

// AI & Recommendations
router.get('/recommendations', authenticateToken, whatsappController.getRecommendations);
router.get('/recommendations/active', authenticateToken, whatsappController.getActiveRecommendations);
router.post('/recommendations/:id/apply', authenticateToken, whatsappController.applyRecommendation);
router.post('/properties/:id/pdf', authenticateToken, whatsappController.sendPropertyPdf);
router.get('/clients/:id/suggest-matches', authenticateToken, aiRateLimiter, whatsappController.suggestMatches);
router.patch('/clients/:id/ai-toggle', authenticateToken, whatsappController.toggleAi);

module.exports = router;
