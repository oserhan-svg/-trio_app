## 2025-05-22 - Unprotected Extension-Facing Endpoints
**Vulnerability:** Several API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were completely unprotected, allowing any client to inject property listings or sync WhatsApp messages without authentication.
**Learning:** Development-focused endpoints for external tools (like Chrome Extensions) are often left open "for ease of development" but create significant data integrity risks.
**Prevention:** Use a dedicated `extensionAuth` middleware with a shared secret API key (hashed and compared in constant time) for all non-user-facing automation endpoints.
