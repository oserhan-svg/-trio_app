## 2025-05-14 - Hardened Extension Auth & CORS
**Vulnerability:** Unprotected extension-facing endpoints and permissive "soft-allow" CORS configuration.
**Learning:** Several endpoints designed for the Chrome extension (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were reachable without any authentication. Additionally, the CORS middleware was configured to log but allow unauthorized origins.
**Prevention:** Always use `extensionAuth` middleware for endpoints intended for the Chrome extension, requiring an `X-Extension-API-Key` header. Use constant-time comparison (e.g., `crypto.timingSafeEqual`) with hashed keys to prevent timing attacks. Ensure CORS rejects unauthorized origins instead of just logging them.
