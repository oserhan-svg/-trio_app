## 2026-04-09 - Securing Extension Endpoints with Timing-Safe API Key Validation
**Vulnerability:** Sensitive scraper and WhatsApp sync endpoints were exposed without authentication, allowing any client to import data or trigger sync events.
**Learning:** When implementing shared-secret authentication, using a simple string comparison is vulnerable to timing attacks.  is the standard solution, but it requires inputs of equal length. Hashing both the input and the secret with SHA-256 before comparison effectively normalizes the length while preserving timing safety.
**Prevention:** Always use timing-safe comparisons for secrets and ensure that all extension-facing or internal-only endpoints are explicitly protected by appropriate middleware (either JWT or shared API Key).
## 2026-04-09 - Securing Extension Endpoints with Timing-Safe API Key Validation
**Vulnerability:** Sensitive scraper and WhatsApp sync endpoints were exposed without authentication, allowing any client to import data or trigger sync events.
**Learning:** When implementing shared-secret authentication, using a simple string comparison is vulnerable to timing attacks. `crypto.timingSafeEqual` is the standard solution, but it requires inputs of equal length. Hashing both the input and the secret with SHA-256 before comparison effectively normalizes the length while preserving timing safety.
**Prevention:** Always use timing-safe comparisons for secrets and ensure that all extension-facing or internal-only endpoints are explicitly protected by appropriate middleware (either JWT or shared API Key).
