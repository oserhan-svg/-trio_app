## 2025-05-15 - Timing-Safe Extension Authentication
**Vulnerability:** Unprotected endpoints (/api/scraper/import, /api/scraper/finished, /api/whatsapp/extension-sync) allowed unauthenticated data injection from any origin.
**Learning:** Extension-to-server communication often bypasses standard JWT-based web auth and requires a dedicated API key mechanism. Simple string comparison of these keys is vulnerable to timing attacks that can leak the secret key character by character.
**Prevention:** Always use `crypto.timingSafeEqual` for secret comparisons. To handle variable-length inputs securely, hash both the provided key and the expected key using a fixed-length algorithm like SHA-256 before performing the timing-safe comparison.
