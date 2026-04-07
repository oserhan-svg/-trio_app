## 2024-05-20 - Unprotected Extension Endpoints
**Vulnerability:** Several API endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were publicly accessible, allowing anyone to import data or trigger sync events without authentication.
**Learning:** Endpoints designed for automated tools like Chrome extensions are often overlooked during standard JWT authentication implementation because they may not have a logged-in user context in the same way a web client does.
**Prevention:** Implement a dedicated API key authentication mechanism (e.g., 'X-Extension-API-Key') for extension-to-server communication. Use timing-safe comparisons to prevent side-channel attacks on these keys.
