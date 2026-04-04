## 2025-05-15 - [API Authentication for Extension]
**Vulnerability:** Several Chrome extension-facing endpoints (`/api/scraper/import`, `/api/scraper/finished`, `/api/whatsapp/extension-sync`) were completely unprotected, allowing any client to push data to the server.
**Learning:** Even internal-facing or extension-facing endpoints must be secured. Using a simple API key combined with a constant-time comparison (`crypto.timingSafeEqual`) and SHA-256 hashing is a robust way to secure such communications without full session management.
**Prevention:** Always include authentication middleware on all POST/PUT/DELETE routes by default, and only explicitly open them if necessary. For extensions, use a shared secret API key stored securely and sent in a custom header.
