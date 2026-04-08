## 2025-05-14 - Timing-Safe Extension Authentication
**Vulnerability:** Extension-facing endpoints (`/api/scraper/import`, `/api/whatsapp/extension-sync`) were entirely unprotected, allowing any client to inject data or trigger synchronization without credentials.
**Learning:** Extension-to-server communication often bypasses standard JWT-based user authentication. Relying on "security by obscurity" for these endpoints is a high-risk pattern. Using a shared secret (API Key) is effective, but simple string comparison (`==` or `===`) can be vulnerable to timing attacks.
**Prevention:** Implement a dedicated authentication middleware for non-browser clients using `crypto.timingSafeEqual` for secret validation and store secrets in environment variables rather than code.
