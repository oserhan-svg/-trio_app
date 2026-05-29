## 2026-05-29 - Overly Permissive CORS with Credentials
**Vulnerability:** The Express CORS configuration allowed any origin by using a permissive fallback (`callback(null, true)`) while also enabling `credentials: true`, effectively defeating CORS protections.
**Learning:** Developers likely intended to log unknown origins during development but accidentally allowed them "softly" in production.
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`) in CORS configuration, especially when credentials are enabled.
