## 2024-10-25 - Fix overly permissive CORS configuration
**Vulnerability:** The Express server's CORS configuration in `server/index.js` allowed any unknown origin to access the API with `credentials: true` enabled by using a permissive fallback (`callback(null, true)`).
**Learning:** A "soft fail" approach was used for unlisted origins (likely to avoid blocking development or extensions), which defeats the purpose of CORS and exposes authenticated endpoints to cross-origin attacks (like CSRF and data exfiltration).
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`) in CORS configurations, especially when `credentials: true` is enabled.
