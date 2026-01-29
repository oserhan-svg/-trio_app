/**
 * Specialized logger for AI operations
 * Provides structured logging with performance metrics
 */
class AILogger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.enablePerformanceLogging = process.env.ENABLE_PERF_LOGS !== 'false';
    }

    /**
     * Format log message with timestamp and context
     */
    formatMessage(level, service, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logData = {
            timestamp,
            level,
            service,
            message,
            ...data
        };

        if (this.logLevel === 'debug') {
            return JSON.stringify(logData, null, 2);
        }

        return `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}`;
    }

    /**
     * Log AI request
     */
    logAIRequest(service, input, metadata = {}) {
        const message = this.formatMessage('info', service, 'AI Request', {
            inputLength: input?.length || 0,
            ...metadata
        });
        console.log(message);
    }

    /**
     * Log AI response with performance metrics
     */
    logAIResponse(service, output, duration, metadata = {}) {
        if (this.enablePerformanceLogging) {
            const message = this.formatMessage('info', service, 'AI Response', {
                outputLength: output?.length || 0,
                durationMs: duration,
                ...metadata
            });
            console.log(message);
        }
    }

    /**
     * Log AI error with context
     */
    logAIError(service, error, context = {}) {
        const message = this.formatMessage('error', service, 'AI Error', {
            error: error.message,
            stack: error.stack,
            ...context
        });
        console.error(message);
    }

    /**
     * Log performance metric
     */
    logPerformanceMetric(operation, duration, metadata = {}) {
        if (this.enablePerformanceLogging) {
            const message = this.formatMessage('perf', 'Performance', operation, {
                durationMs: duration,
                ...metadata
            });

            // Warn if operation is slow
            if (duration > 2000) {
                console.warn(`⚠️ Slow operation detected: ${message}`);
            } else {
                console.log(message);
            }
        }
    }

    /**
     * Log cache hit/miss
     */
    logCacheEvent(operation, hit, key, metadata = {}) {
        if (this.logLevel === 'debug') {
            const message = this.formatMessage('debug', 'Cache', operation, {
                hit,
                key,
                ...metadata
            });
            console.log(message);
        }
    }

    /**
     * Log database query with performance
     */
    logDatabaseQuery(query, duration, metadata = {}) {
        if (this.enablePerformanceLogging && this.logLevel === 'debug') {
            const message = this.formatMessage('debug', 'Database', query, {
                durationMs: duration,
                ...metadata
            });
            console.log(message);
        }
    }

    /**
     * Create a timer for performance tracking
     */
    startTimer(label) {
        return {
            label,
            startTime: Date.now(),
            end: () => {
                const duration = Date.now() - this.startTime;
                this.logPerformanceMetric(label, duration);
                return duration;
            }
        };
    }

    /**
     * Log info message
     */
    info(service, message, data = {}) {
        const formatted = this.formatMessage('info', service, message, data);
        console.log(formatted);
    }

    /**
     * Log warning message
     */
    warn(service, message, data = {}) {
        const formatted = this.formatMessage('warn', service, message, data);
        console.warn(formatted);
    }

    /**
     * Log debug message
     */
    debug(service, message, data = {}) {
        if (this.logLevel === 'debug') {
            const formatted = this.formatMessage('debug', service, message, data);
            console.log(formatted);
        }
    }

    /**
     * Log error message
     */
    error(service, message, error, data = {}) {
        const formatted = this.formatMessage('error', service, message, {
            error: error?.message,
            stack: error?.stack,
            ...data
        });
        console.error(formatted);
    }
}

// Export singleton instance
module.exports = new AILogger();
