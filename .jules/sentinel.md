## 2024-05-24 - Fix Overly Permissive CORS with Credentials

**Vulnerability:** The application's Express server and Socket.io instances had overly permissive CORS configurations (allowing unknown origins) combined with `credentials: true`. This exposes the application to Cross-Origin Resource Sharing attacks where attackers can perform cross-origin requests with user credentials (cookies, HTTP auth).
**Learning:** Returning `callback(null, true)` for unknown origins defeats the purpose of CORS. Combined with `credentials: true`, this creates a severe risk because browsers allow sending authenticated requests from malicious domains and reading the response.
**Prevention:** Always explicitly define and restrict allowed origins, and return an error (e.g., `callback(new Error('Not allowed by CORS'))`) for unknown or unauthorized origins instead of softly allowing them.
