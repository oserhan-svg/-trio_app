## 2024-07-08 - Overly Permissive CORS with Credentials
**Vulnerability:** CORS configuration in Express and Socket.io allowed all origins dynamically while enabling `credentials: true`, effectively exposing authenticated endpoints to any malicious site.
**Learning:** Developers used `callback(null, true)` as a fallback for unknown origins to "softly" allow them during development, inadvertently creating a severe CSRF/data-exposure vector in production.
**Prevention:** Always default to explicitly denying unknown origins (`callback(new Error('Not allowed by CORS'))`), especially when `credentials` are enabled. Avoid permissive fallbacks in production configurations.
