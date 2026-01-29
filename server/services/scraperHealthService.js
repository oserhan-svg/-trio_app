const prisma = require('../db');
const taskOrchestrator = require('./taskOrchestratorService');

class ScraperHealthService {
    constructor() {
        this.metrics = {
            sahibinden: { successCount: 0, failureCount: 0, lastFailureReason: null, healthScore: 100 },
            hepsiemlak: { successCount: 0, failureCount: 0, lastFailureReason: null, healthScore: 100 },
            emlakjet: { successCount: 0, failureCount: 0, lastFailureReason: null, healthScore: 100 }
        };
    }

    /**
     * Report an event from a scraper
     */
    async reportEvent(portal, isSuccess, reason = null) {
        const portalKey = portal.toLowerCase();
        if (!this.metrics[portalKey]) return;

        if (isSuccess) {
            this.metrics[portalKey].successCount++;
            // Slowly recover health score on success
            this.metrics[portalKey].healthScore = Math.min(100, this.metrics[portalKey].healthScore + 2);
        } else {
            this.metrics[portalKey].failureCount++;
            this.metrics[portalKey].lastFailureReason = reason;
            // Drop health score on failure
            this.metrics[portalKey].healthScore = Math.max(0, this.metrics[portalKey].healthScore - 15);

            // Check if we need to trigger a "Heal" task
            if (this.metrics[portalKey].healthScore < 50) {
                await this.triggerHealTask(portalKey, reason);
            }
        }
    }

    async triggerHealTask(portal, reason) {
        console.log(`🚑 Triggering HEAL TASK for ${portal} due to low health (${this.metrics[portal].healthScore})`);

        await taskOrchestrator.enqueue('scraper_sync', {
            portal,
            mode: 'safe_retry',
            priority: 'high',
            reason: reason || 'Low health score'
        }, new Date(Date.now() + 300000)); // Retry in 5 minutes with safer settings

        // Reset health after queuing heal to avoid spamming
        this.metrics[portal].healthScore = 75;
    }

    /**
     * Get overall monitoring report
     */
    getGlobalHealth() {
        const report = {};
        Object.entries(this.metrics).forEach(([portal, m]) => {
            report[portal] = {
                status: m.healthScore > 80 ? 'healthy' : m.healthScore > 40 ? 'degraded' : 'critical',
                score: m.healthScore,
                stats: {
                    success: m.successCount,
                    failure: m.failureCount,
                    lastError: m.lastFailureReason
                }
            };
        });
        return report;
    }

    /**
     * Simulated Proxy/UA management
     */
    async getOptimalConfig(portal) {
        // In a real app, this would select from a pool of proxies/UAs
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];

        return {
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            viewport: { width: 1920, height: 1080 },
            delayMultiplier: this.metrics[portal.toLowerCase()].healthScore < 60 ? 2 : 1
        };
    }
}

module.exports = new ScraperHealthService();
