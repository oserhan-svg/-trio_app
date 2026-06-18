## 2025-01-30 - Fix Permissive CORS Configuration
**Vulnerability:** CORS in both Express and Socket.io was configured with `credentials: true` while allowing all origins via a wildcard-like fallback `callback(null, true)`.
**Learning:** Returning `callback(null, true)` for unknown origins allows arbitrary cross-origin requests with credentials (cookies/auth headers), exposing the application to severe cross-site attacks.
**Prevention:** Always explicitly deny unknown origins by returning `callback(new Error('Not allowed by CORS'))` when `credentials: true` is enabled.
