## 2025-01-08 - Fix Insecure CORS Configuration
**Vulnerability:** Permissive fallback (`callback(null, true)`) in CORS configuration combined with `credentials: true`.
**Learning:** In development, it's common to lazily allow all new origins while debugging, but leaving it with `credentials: true` creates a critical security vulnerability that allows an attacker to make authenticated cross-origin requests.
**Prevention:** Always explicitly deny unknown origins in production environments rather than defaulting to allow.
