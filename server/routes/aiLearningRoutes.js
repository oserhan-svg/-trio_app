const express = require('express');
const router = express.Router();
const aiLearningController = require('../controllers/aiLearningController');
const { isAdmin } = require('../middleware/authMiddleware');

// All learning routes are admin-only
router.post('/optimize', isAdmin, (req, res) => aiLearningController.runManualOptimization(req, res));
router.get('/insights', isAdmin, (req, res) => aiLearningController.getLearnedInsights(req, res));
router.patch('/insights/:id/approve', isAdmin, (req, res) => aiLearningController.approveInsight(req, res));
router.delete('/insights/:id', isAdmin, (req, res) => aiLearningController.deleteInsight(req, res));
router.post('/feedback/:id', (req, res) => aiLearningController.submitFeedback(req, res));
router.get('/stats', isAdmin, (req, res) => aiLearningController.getAIStats(req, res));
router.post('/autotrain', isAdmin, async (req, res) => {
    try {
        const AutoTrainService = require('../services/AutoTrainService');
        await AutoTrainService.runNightlyAnalysis();
        res.json({ success: true, message: 'AutoTrain analysis completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
