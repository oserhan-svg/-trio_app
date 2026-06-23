## 2024-06-23 - Overly Permissive CORS with Credentials
**Vulnerability:** CORS configuration in `server/index.js` and `server/services/socketService.js` explicitly allowed unknown origins by invoking `callback(null, true)` while `credentials: true` was enabled.
**Learning:** Returning `true` for all origins effectively bypasses CORS protections, especially dangerous when credentials (cookies, auth headers) are included, leading to CSRF and cross-origin data exposure.
**Prevention:** Always validate `origin` against an explicit whitelist of allowed domains and return an error (`callback(new Error('Not allowed by CORS'))`) for unrecognized origins.
