## 2025-05-14 - Constant-Time API Key Validation
**Vulnerability:** Missing authentication and potential timing attacks on extension-facing endpoints.
**Learning:** Comparing secrets of different lengths using `crypto.timingSafeEqual` directly can cause a runtime error. Hashing both inputs with a fixed-length algorithm (like SHA-256) before comparison ensures equal buffer lengths and masks the actual secret length.
**Prevention:** Always hash secrets to a fixed length before using `crypto.timingSafeEqual` and ensure all external-facing endpoints have explicit authentication middleware.
