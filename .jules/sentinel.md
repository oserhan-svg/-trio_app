## 2025-05-14 - Extension API Key Authentication
**Vulnerability:** Unauthenticated endpoints exposed to the public internet were used by the Chrome extension to sync data, allowing any actor to inject listings or WhatsApp messages.
**Learning:** Chrome extension endpoints often get overlooked in standard web auth flows. Using a dedicated `x-api-key` header with SHA-256 hashing and `crypto.timingSafeEqual` provides a robust, low-overhead security layer for these machine-to-machine interactions.
**Prevention:** Always secure extension-facing endpoints with API keys or similar tokens and ensure they are validated using constant-time comparison to mitigate timing attacks.
