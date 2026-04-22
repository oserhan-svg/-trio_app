## 2025-05-20 - [API Authentication for Extension]
**Vulnerability:** Unprotected internal API endpoints (`/api/scraper/import`, `/api/scraper/finished`, `/api/whatsapp/extension-sync`) allowed any local process or malicious website (via CSRF) to inject data into the system.
**Learning:** Endpoints designed for local-only tools (like Chrome Extensions) often overlook authentication, assuming local origin is sufficient protection. However, without shared secrets, they remain vulnerable to cross-origin requests from browsers.
**Prevention:** Always implement a shared-secret or token-based authentication mechanism for internal APIs, and use `crypto.timingSafeEqual` for secure string comparisons of keys.
