const rateLimit = require('express-rate-limit');

// General AI Rate Limit (e.g., 20 requests per minute)
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute
    message: { error: 'Too many AI requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter Limit for Heavy Operations (e.g., Image Analysis, Bulk Discovery)
const heavyAiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 heavy requests per minute
    message: { error: 'Too many heavy AI operations, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    aiRateLimiter,
    heavyAiRateLimiter
};
