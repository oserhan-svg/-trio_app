/**
 * Temporal Delay Utilities
 * Provides human-like delay patterns based on time of day and user behavior
 */

/**
 * Get human-like delay based on current hour
 * Peak hours (9-12, 14-18): Faster, more active browsing
 * Off-peak hours: Slower, more deliberate browsing
 */
function getHumanLikeDelay(customHour = null) {
    const hour = customHour !== null ? customHour : new Date().getHours();

    // Peak business hours: 9-12, 14-18
    const isPeakHours = (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 18);

    if (isPeakHours) {
        // Faster browsing during peak hours (2-5 seconds)
        return Math.random() * 3000 + 2000;
    } else if (hour >= 22 || hour <= 6) {
        // Very slow during night/early morning (10-20 seconds)
        return Math.random() * 10000 + 10000;
    } else {
        // Normal off-peak (5-13 seconds)
        return Math.random() * 8000 + 5000;
    }
}

/**
 * Get page transition delay (between pages in same session)
 */
function getPageTransitionDelay() {
    // Base delay: 3-8 seconds
    const baseDelay = Math.random() * 5000 + 3000;

    // 20% chance of longer pause (like checking something else)
    if (Math.random() < 0.2) {
        return baseDelay + Math.random() * 10000; // Additional 0-10 seconds
    }

    return baseDelay;
}

/**
 * Get delay for scrolling/reading content
 */
function getReadingDelay(contentLength = 'medium') {
    const delays = {
        short: { min: 1000, max: 3000 },      // Quick glance
        medium: { min: 3000, max: 8000 },     // Normal reading
        long: { min: 8000, max: 15000 }       // Detailed review
    };

    const range = delays[contentLength] || delays.medium;
    return Math.random() * (range.max - range.min) + range.min;
}

/**
 * Determine if we should take a break (simulate real user behavior)
 */
function shouldTakeBreak(requestCount, sessionDuration) {
    // Take a break after 50-80 requests
    if (requestCount > 50 && Math.random() < 0.3) {
        return true;
    }

    // Take a break after 2-3 hours of continuous activity
    const hoursActive = sessionDuration / (1000 * 60 * 60);
    if (hoursActive > 2 && Math.random() < 0.5) {
        return true;
    }

    return false;
}

/**
 * Get break duration (15-30 minutes)
 */
function getBreakDuration() {
    // 15-30 minutes in milliseconds
    return (Math.random() * 15 + 15) * 60 * 1000;
}

/**
 * Get delay variation based on success rate
 * If we're getting blocked often, increase delays
 */
function getAdaptiveDelay(baseDelay, successRate) {
    if (successRate < 0.5) {
        // Low success rate: increase delay by 2-3x
        return baseDelay * (2 + Math.random());
    } else if (successRate < 0.7) {
        // Medium success rate: increase delay by 1.5-2x
        return baseDelay * (1.5 + Math.random() * 0.5);
    } else {
        // High success rate: use base delay with small variation
        return baseDelay * (0.8 + Math.random() * 0.4);
    }
}

/**
 * Check if current time is optimal for scraping
 * Returns true during business hours in Turkey (9-20)
 */
function isOptimalScrapingTime() {
    const hour = new Date().getHours();
    // Optimal: 9 AM - 8 PM Turkey time
    return hour >= 9 && hour <= 20;
}

/**
 * Get recommended scraping window
 * Returns next optimal time window if current time is not optimal
 */
function getNextOptimalWindow() {
    const now = new Date();
    const hour = now.getHours();

    if (isOptimalScrapingTime()) {
        return null; // Already in optimal window
    }

    const nextStart = new Date(now);
    if (hour < 9) {
        // Before 9 AM: wait until 9 AM
        nextStart.setHours(9, 0, 0, 0);
    } else {
        // After 8 PM: wait until 9 AM next day
        nextStart.setDate(nextStart.getDate() + 1);
        nextStart.setHours(9, 0, 0, 0);
    }

    return nextStart;
}

/**
 * Simulate typing delay (for search boxes, forms)
 */
function getTypingDelay(text) {
    // Average typing speed: 40-60 WPM = 200-300ms per character
    const baseDelay = 200 + Math.random() * 100;

    // Add occasional longer pauses (thinking/correcting)
    const delays = [];
    for (let i = 0; i < text.length; i++) {
        if (Math.random() < 0.1) {
            // 10% chance of longer pause (500-1500ms)
            delays.push(500 + Math.random() * 1000);
        } else {
            delays.push(baseDelay + (Math.random() - 0.5) * 100);
        }
    }

    return delays;
}

module.exports = {
    getHumanLikeDelay,
    getPageTransitionDelay,
    getReadingDelay,
    shouldTakeBreak,
    getBreakDuration,
    getAdaptiveDelay,
    isOptimalScrapingTime,
    getNextOptimalWindow,
    getTypingDelay
};
