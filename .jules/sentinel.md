## 2025-05-21 - Secure Extension API Authentication
**Vulnerability:** Several API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were exposed without any authentication, allowing anyone to push data to the server or trigger sync events.
**Learning:** Chrome extension endpoints often get overlooked during standard auth sweeps because they don't use standard JWT/Session auth.
**Prevention:** Always implement a dedicated API key middleware for non-user-facing integrations and use `crypto.timingSafeEqual` with hashed values for constant-time comparison.
