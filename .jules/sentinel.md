## 2024-05-15 - Unauthenticated Internal Migration Endpoint and Missing Error Sanitization
**Vulnerability:** Found an unauthenticated endpoint (`/internal/migrate`) in `server/routes/dealRoutes.js` that triggers a child process `exec` call (`prisma migrate dev`). It also leaks `stderr` in the response when an error occurs.
**Learning:** Even internal utility endpoints need authentication. Calling `exec` without proper access control poses a critical security risk (RCE/DoD). Returning raw command output to the client risks leaking internal system paths and environment details.
**Prevention:** Always secure internal/admin routes with `isAdmin` middleware. Never send raw error objects or standard error output directly to the client; sanitize error responses.
