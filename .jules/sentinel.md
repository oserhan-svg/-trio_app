## 2025-05-15 - [Extension API Authentication]
**Vulnerability:** Several Chrome extension-facing endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were completely unprotected, allowing any external actor to inject fake data or sync messages.
**Learning:** Development-focused endpoints for third-party integrations (like extensions) are often overlooked during standard JWT authentication implementation.
**Prevention:** Always use a secondary authentication mechanism (e.g., shared secret API key) for headless integrations that don't share the same user session as the main frontend.
