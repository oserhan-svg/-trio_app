## 2024-05-24 - Overly Permissive CORS Configuration
**Vulnerability:** The server's CORS configuration in `server/index.js` allowed any unknown origin to access the API by falling back to `callback(null, true)`.
**Learning:** This permissive fallback was added to softly allow new origins but critically compromises security when `credentials: true` is enabled, potentially allowing malicious sites to access authenticated endpoints.
**Prevention:** Always explicitly deny unknown origins by returning `callback(new Error('Not allowed by CORS'))` and maintain an explicit list of allowed origins or patterns.
