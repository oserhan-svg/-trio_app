## 2024-05-24 - Overly Permissive CORS Configuration with Credentials
**Vulnerability:** The Express server's CORS configuration used `callback(null, true)` for unknown origins even when `credentials: true` was enabled.
**Learning:** The soft fallback was likely introduced to ease local development or extension testing but created a severe security risk by allowing any site to perform authenticated requests.
**Prevention:** Always explicitly deny unknown origins using `callback(new Error('Not allowed by CORS'))` and never use permissive fallbacks when `credentials: true` is enabled. Use targeted allowed origin lists instead.
