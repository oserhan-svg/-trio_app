## 2025-05-14 - Securing Extension Endpoints and CORS Policy
**Vulnerability:** Several API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were exposed without authentication, and the CORS policy was configured to "allow softly," letting unauthorized origins through.
**Learning:** Browser extension endpoints often bypass standard JWT-based user authentication and require a dedicated API key strategy. Timing side-channel attacks are a risk when comparing these keys.
**Prevention:** Use `extensionAuth` middleware for all extension-facing routes. Always hash both the provided and stored API keys before performing a `crypto.timingSafeEqual` comparison to ensure equal length and prevent timing attacks. Enforce a strict CORS origin rejection policy.
