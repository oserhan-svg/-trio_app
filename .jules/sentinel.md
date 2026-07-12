## 2024-07-13 - Overly Permissive CORS with Credentials
**Vulnerability:** CORS configurations in Express (`server/index.js`) and Socket.io (`server/services/socketService.js`) were returning `callback(null, true)` for unknown origins while `credentials: true` was enabled.
**Learning:** A permissive fallback allowing any origin combined with `credentials: true` exposes the application to severe Cross-Site Request Forgery (CSRF) and data leakage, as browsers will send session cookies with requests from any malicious site.
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`) rather than using a permissive fallback, especially when `credentials: true` is enabled.
