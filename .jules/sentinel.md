## 2025-04-15 - Hardening Extension Authentication and CORS

**Vulnerability:** Missing authentication on extension-facing endpoints and "soft allow" CORS policy.
**Learning:** Development-friendly policies (like logging instead of rejecting CORS, or leaving internal-ish endpoints open) often persist into production environments, creating significant security gaps.
**Prevention:**
1. Always enforce authentication on all non-public API endpoints from day one.
2. Use timing-safe comparison (`crypto.timingSafeEqual`) for API keys and secrets.
3. For keys of varying lengths, hash both the provided key and the expected key before comparison to ensure uniform length for `timingSafeEqual`.
4. Implement strict CORS rejection policies rather than logging unauthorized origins.
