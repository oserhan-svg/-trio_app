## 2026-04-11 - Secured Extension Endpoints with API Key
**Vulnerability:** Multiple extension-facing endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) were unauthenticated, allowing arbitrary data injection or state manipulation.
**Learning:** Endpoints designed for external tools (like Chrome extensions) are often overlooked during standard JWT auth implementation.
**Prevention:** Always implement a dedicated authentication mechanism (e.g., API keys with timing-safe comparison) for non-browser clients and verify all routes have either user or machine authentication.
