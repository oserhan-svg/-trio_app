## 2026-06-10 - Overly Permissive CORS with Credentials
**Vulnerability:** The Express server's CORS configuration allowed any unknown origin to make cross-origin requests by softly returning `callback(null, true)` in the fallback handler.
**Learning:** Returning true for any origin when `credentials: true` is enabled essentially bypasses CORS restrictions entirely, allowing malicious sites to make authenticated requests to the API.
**Prevention:** Always explicitly deny unknown origins in CORS origin callbacks by returning an error (e.g., `callback(new Error('Not allowed by CORS'))`), and never fall back to blindly accepting all origins in a production environment with credentials.
