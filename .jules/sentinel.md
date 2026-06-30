## 2024-07-01 - Overly Permissive CORS Configuration
**Vulnerability:** The Express and Socket.io servers were configured to allow all origins dynamically while `credentials: true` was enabled, which exposes the application to severe CSRF and cross-origin data leaks.
**Learning:** Returning `callback(null, true)` for unknown origins effectively bypasses CORS restrictions.
**Prevention:** Always explicitly deny unknown origins using `callback(new Error('Not allowed by CORS'))` when `credentials: true` is enabled.