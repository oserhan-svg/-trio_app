## 2026-03-19 - [EXTENSION_AUTH] Secure API Key validation for extension endpoints
**Vulnerability:** Unprotected API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were accessible without any authentication, allowing anyone to push data to the database.
**Learning:** For monorepos with Chrome extensions, it's easy to overlook backend authentication for extension-specific routes, especially when they differ from standard JWT-based user auth.
**Prevention:** All external-facing API endpoints must have a defined authentication middleware. Use `crypto.timingSafeEqual` with SHA-256 hashes for API key validation to prevent timing attacks while ensuring same-length buffer comparison.
