## 2025-05-15 - [CRITICAL/HIGH] Fix Unprotected Extension-Facing Endpoints
**Vulnerability:** Several API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were completely unprotected, allowing any user or bot to inject fake data or trigger sync operations.
**Learning:** Extension-facing endpoints are often overlooked during standard web auth implementation because they can't easily use session-based or interactive JWT flows.
**Prevention:** Always implement a dedicated API key authentication layer for non-browser clients (extensions, webhooks) and use constant-time comparison to prevent timing attacks.
