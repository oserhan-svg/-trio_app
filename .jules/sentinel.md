## 2026-04-10 - [Timing-Safe API Key Authentication & CORS Hardening]
**Vulnerability:** Overly permissive CORS policy and unauthenticated extension endpoints.
**Learning:** Using `crypto.timingSafeEqual` with hashed inputs allows for secure comparison of secrets regardless of their length, preventing timing side-channel attacks. A "soft allow" CORS policy effectively bypasses origin-based security.
**Prevention:** Always use fail-closed logic for CORS and implement timing-safe authentication for all system-to-system or extension-to-system integrations.
