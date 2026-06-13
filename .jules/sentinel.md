## 2024-05-24 - Overly Permissive CORS Configuration
**Vulnerability:** The Express server in `server/index.js` allowed any unknown origin to access the API by returning `callback(null, true)` in the fallback case, even when `credentials: true` was enabled.
**Learning:** The soft fallback defeated the purpose of maintaining an `allowedOrigins` list and exposed the application to cross-origin requests from malicious domains, potentially leaking sensitive data or allowing unauthorized actions via credentials.
**Prevention:** Always explicitly deny unknown origins in CORS configurations by returning an error (e.g., `callback(new Error('Not allowed by CORS'))`) rather than defaulting to permissive behavior.
