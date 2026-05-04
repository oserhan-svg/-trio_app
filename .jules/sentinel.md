## 2025-05-04 - Securing Migration Endpoints & Log Sanitization
**Vulnerability:** Unprotected internal migration route exposing shell execution risk (RCE) and plain-text password logging.
**Learning:** Internal utility routes (like migrations) are often overlooked during security reviews, and direct `req.body` logging can accidentally leak sensitive credentials like passwords.
**Prevention:** Always apply defense-in-depth (auth middleware + secondary secret key) for routes that execute system commands. Use structured logging that explicitly redacts sensitive fields before outputting to console or files.
