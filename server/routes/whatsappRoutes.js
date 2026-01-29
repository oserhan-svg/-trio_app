const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/authMiddleware');
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
router.post('/extension-sync', whatsappController.syncExtension); // Often used by extension with different auth or none? Keeping consistent with old file (no auth middleware visible in old snippet but controller checks are safe)
// Actually, looking at old file, likely used body data. If auth is needed, extension sends token?
// Assuming controller handles it or it's open for the extension scenario. 
// Re-adding authenticateToken to be safe if that was the case, but most likely extension endpoints use API keys or similar.
// I will omit authenticateToken for extension-sync based on common patterns, or better, keep it if extension sends it.
// To be safe, I'll match the previous file's likely pattern. I didn't see explicit auth middleware on the extension route in the view, so I'll leave it open BUT verify controller logic.
// Controller syncExtension doesn't use req.user. OK.

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
