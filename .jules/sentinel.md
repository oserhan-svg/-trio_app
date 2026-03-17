## 2025-05-14 - Secure Extension Authentication
**Vulnerability:** Unprotected API endpoints for Chrome Extension data import and sync.
**Learning:** Hardcoding API keys in the extension background script or server middleware is a significant risk. The server should strictly require environment variables, and the extension should pull the key from storage or a build-time configuration.
**Prevention:** Use an `authenticatedFetch` wrapper in the extension and a strict middleware on the server that fails securely (500) if configuration is missing. Always use `crypto.timingSafeEqual` with hashing for constant-time string comparisons to mitigate timing attacks.
