## 2025-05-14 - Secure API Key Comparison Pattern
**Vulnerability:** Timing attacks on API key verification endpoints.
**Learning:** Standard string comparison (`==` or `===`) is not constant-time and can leak information about the correct key through response time differences. Even `crypto.timingSafeEqual` requires both inputs to have the same length.
**Prevention:** Hash both the provided key and the expected key with SHA-256 before passing them to `crypto.timingSafeEqual`. This ensures they always have the same length and the comparison is timing-safe.
