## 2025-05-15 - Missing Authentication on Extension Endpoints
**Vulnerability:** Several sensitive endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were completely unprotected, allowing anyone to inject data or sync messages.
**Learning:** Development of external integrations (like Chrome extensions) often leads to endpoints that bypass standard JWT authentication to simplify implementation, but they are frequently forgotten and left completely open.
**Prevention:** All external-facing endpoints must have at least an API Key-based authentication mechanism. Use `crypto.timingSafeEqual` with hashed values for constant-time secret comparison.
