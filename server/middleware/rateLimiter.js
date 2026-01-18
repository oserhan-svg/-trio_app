const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for dashboard widgets
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Strict rate limiter for authentication routes (login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Limit each IP to 100 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts, please try again after 15 minutes'
    }
});

// Strict rate limiter for scraping actions (resource intensive)
const scrapeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 scrape triggers per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many scrape requests, please try again later.'
    }
});

module.exports = { apiLimiter, authLimiter, scrapeLimiter };
