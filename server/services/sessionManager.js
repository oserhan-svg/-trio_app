/**
 * Session Manager
 * Manages browser sessions with rotation logic to avoid detection
 */

const socketService = require('./socketService');
const fs = require('fs');
const path = require('path');

class SessionManager {
    constructor(options = {}) {
        this.maxRequestsPerSession = options.maxRequestsPerSession || (50 + Math.floor(Math.random() * 30)); // 50-80 requests
        this.maxSessionDuration = options.maxSessionDuration || (2 * 60 * 60 * 1000); // 2 hours
        this.requestCount = 0;
        this.sessionStartTime = Date.now();
        this.successCount = 0;
        this.failureCount = 0;
        this.listingCount = 0;
        this.currentBrowser = null;
        this.currentPage = null;
        this.portalStats = {
            sahibinden: { requestCount: 0, successCount: 0, failureCount: 0, listingCount: 0, lastSuccess: null },
            hepsiemlak: { requestCount: 0, successCount: 0, failureCount: 0, listingCount: 0, lastSuccess: null },
            emlakjet: { requestCount: 0, successCount: 0, failureCount: 0, listingCount: 0, lastSuccess: null }
        };
        this.recentEvents = []; // Max 50 events
        this.totalRawListingCount = 0; // Lifetime total from all sessions
    }

    /**
     * Track raw listings (before deduplication)
     */
    trackRawListings(count) {
        this.totalRawListingCount += count;
        const stats = this.getStats();
        this.saveToFile(stats);
    }

    /**
     * Track a request
     */
    trackRequest(success = true, portal = null) {
        this.requestCount++;
        if (success) {
            this.successCount++;
        } else {
            this.failureCount++;
        }

        if (portal && this.portalStats[portal]) {
            this.portalStats[portal].requestCount++;
            if (success) {
                this.portalStats[portal].successCount++;
                this.portalStats[portal].lastSuccess = new Date();
            } else {
                this.portalStats[portal].failureCount++;
            }
        }
        const stats = this.getStats();
        socketService.emit('scraper_update', stats);
        this.saveToFile(stats); // Force save
    }

    /**
     * Track listings found
     */
    trackListings(portal, count) {
        if (portal && this.portalStats[portal]) {
            this.portalStats[portal].listingCount += count;
            this.listingCount += count;
        }
        const stats = this.getStats();
        socketService.emit('scraper_update', stats);
        this.saveToFile(stats); // Force save
    }

    /**
     * Log a scraper event
     */
    addEvent(message, type = 'info', portal = null) {
        const event = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            message,
            type, // 'info', 'success', 'warning', 'error'
            portal
        };
        this.recentEvents.unshift(event);
        if (this.recentEvents.length > 50) {
            this.recentEvents.pop();
        }
        console.log(`[SCRAPER_EVENT] [${type.toUpperCase()}] ${portal ? `[${portal}] ` : ''}${message}`);
        const stats = this.getStats();
        socketService.emit('scraper_update', stats);
        this.saveToFile(stats); // Force save
    }

    /**
     * Get current session statistics
     */
    getStats() {
        const duration = Date.now() - this.sessionStartTime;
        const successRate = this.requestCount > 0 ? this.successCount / this.requestCount : 1;

        // Recalculate listingCount from portalStats to ensure consistency
        const calculatedListingCount = Object.values(this.portalStats).reduce((sum, p) => sum + (p.listingCount || 0), 0);

        const stats = {
            requestCount: this.requestCount,
            successCount: this.successCount,
            failureCount: this.failureCount,
            successRate: successRate,
            listingCount: Math.max(this.listingCount, calculatedListingCount),
            totalRawListingCount: this.totalRawListingCount,
            duration: duration,
            durationMinutes: Math.floor(duration / 60000),
            portalStats: this.portalStats,
            recentEvents: this.recentEvents,
            timestamp: new Date()
        };

        // Auto-save removed to prevent API overwrite
        return stats;
    }

    /**
     * Save stats to JSON file with Atomic Write
     */
    saveToFile(stats) {
        try {
            const statusDir = path.join(__dirname, '../browser_data');
            if (!fs.existsSync(statusDir)) {
                fs.mkdirSync(statusDir, { recursive: true });
            }
            const statusFile = path.join(statusDir, 'scraper_status.json');
            const tempFile = statusFile + '.tmp';

            // Atomic Write: Write to temp -> Rename
            fs.writeFileSync(tempFile, JSON.stringify(stats, null, 2));

            try {
                fs.renameSync(tempFile, statusFile);
                // console.log('[DEBUG] Stats saved atomically.');
            } catch (renameErr) {
                // Fallback for Windows lock issues
                fs.copyFileSync(tempFile, statusFile);
                fs.unlinkSync(tempFile);
            }
        } catch (e) {
            console.error('❌ Failed to save stats to file:', e.message);
        }
    }

    /**
     * Load stats from JSON file
     */
    static loadFromFile() {
        try {
            const statusFile = path.join(__dirname, '../browser_data/scraper_status.json');
            if (fs.existsSync(statusFile)) {
                const data = fs.readFileSync(statusFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            // Return null if file doesn't exist or is invalid
        }
        return null;
    }

    /**
     * Check if session should be rotated
     */
    shouldRotateSession() {
        const stats = this.getStats();

        // Rotate if max requests reached
        if (this.requestCount >= this.maxRequestsPerSession) {
            console.log(`🔄 Session rotation: Max requests reached (${this.requestCount}/${this.maxRequestsPerSession})`);
            return true;
        }

        // Rotate if max duration reached
        if (stats.duration >= this.maxSessionDuration) {
            console.log(`🔄 Session rotation: Max duration reached (${stats.durationMinutes} minutes)`);
            return true;
        }

        // Rotate if success rate is too low (< 50%)
        if (this.requestCount > 10 && stats.successRate < 0.5) {
            console.log(`🔄 Session rotation: Low success rate (${(stats.successRate * 100).toFixed(1)}%)`);
            return true;
        }

        return false;
    }

    /**
     * Reset session counters
     */
    resetSession() {
        const oldStats = this.getStats();
        console.log(`📊 Session completed: ${oldStats.requestCount} requests, ${(oldStats.successRate * 100).toFixed(1)}% success, ${oldStats.durationMinutes} minutes`);

        this.successCount = 0;
        this.failureCount = 0;
        this.listingCount = 0;
        this.sessionStartTime = Date.now();

        // Randomize next session limits
        this.maxRequestsPerSession = 50 + Math.floor(Math.random() * 30);
        this.maxSessionDuration = (1.5 + Math.random()) * 60 * 60 * 1000; // 1.5-2.5 hours

        console.log(`✨ New session started: max ${this.maxRequestsPerSession} requests, ${Math.floor(this.maxSessionDuration / 60000)} minutes`);
    }

    /**
     * Set current browser and page
     */
    setBrowser(browser, page) {
        this.currentBrowser = browser;
        this.currentPage = page;
    }

    /**
     * Get current browser and page
     */
    getBrowser() {
        return { browser: this.currentBrowser, page: this.currentPage };
    }

    /**
     * Close current session browser
     */
    async closeCurrentSession() {
        if (this.currentBrowser) {
            try {
                await this.currentBrowser.close();
                console.log('🚪 Browser session closed');
            } catch (e) {
                console.log('⚠️ Error closing browser:', e.message);
            }
            this.currentBrowser = null;
            this.currentPage = null;
        }
    }

    /**
     * Rotate session (close current, prepare for new)
     */
    async rotateSession() {
        await this.closeCurrentSession();
        this.resetSession();
    }

    /**
     * Get fingerprint variation level based on rotation count
     * More rotations = more variation to avoid tracking
     */
    getFingerprintVariation() {
        const rotationCount = Math.floor(this.requestCount / 20); // Increment every 20 requests

        return {
            // Increase variation slightly with each rotation
            canvasNoise: 0.01 + (rotationCount * 0.005),
            audioNoise: 0.0000001 * (1 + rotationCount * 0.1),
            fontMaskingRate: 0.05 + (rotationCount * 0.01)
        };
    }

    /**
     * Get recommended action based on current state
     */
    getRecommendedAction() {
        const stats = this.getStats();

        if (this.shouldRotateSession()) {
            return 'ROTATE_SESSION';
        }

        if (stats.successRate < 0.7 && this.requestCount > 5) {
            return 'INCREASE_DELAYS';
        }

        if (stats.successRate > 0.9 && this.requestCount > 20) {
            return 'DECREASE_DELAYS';
        }

        return 'CONTINUE_NORMAL';
    }
}

// Global session manager instance
global.__sessionManager = global.__sessionManager || null;

/**
 * Get or create global session manager
 */
function getSessionManager(options = {}) {
    if (!global.__sessionManager) {
        global.__sessionManager = new SessionManager(options);

        // Try to resume from file
        const saved = SessionManager.loadFromFile();
        if (saved) {
            global.__sessionManager.totalRawListingCount = saved.totalRawListingCount || 0;
            // Optionally restore portal stats too if needed, but total count is primary
        }
    }
    return global.__sessionManager;
}

/**
 * Reset global session manager
 */
function resetSessionManager() {
    if (global.__sessionManager) {
        global.__sessionManager.resetSession();
    }
}

module.exports = {
    SessionManager,
    getSessionManager,
    resetSessionManager
};
