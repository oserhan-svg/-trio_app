## 2025-04-01 - Extension API Authentication
**Vulnerability:** Unprotected endpoints for Chrome extension integration.
**Learning:** Legacy design prioritized ease of integration for the extension, leaving `/api/scraper/import` and other endpoints open to anyone who knew the URL.
**Prevention:** Always implement at least a shared secret (API Key) for machine-to-machine integrations, and use constant-time comparison to prevent timing attacks.
