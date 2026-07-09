## 2024-05-19 - Overly Permissive CORS with Credentials
**Vulnerability:** The CORS configuration in `server/index.js` and `server/services/socketService.js` allowed any origin to connect by always falling back to `callback(null, true)`, while also enabling `credentials: true`. This allows cross-origin requests with cookies/auth tokens from malicious sites.
**Learning:** Developers sometimes use permissive fallbacks ("allowing softly") during development to avoid CORS errors but forget to secure them. `credentials: true` combined with wildcard/permissive origin is a severe risk.
**Prevention:** Always explicitly deny unknown origins using `callback(new Error('Not allowed by CORS'))` and never use permissive fallbacks when `credentials: true` is enabled.
