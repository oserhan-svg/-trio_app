## 2025-05-15 - Unprotected Migration Endpoint and Sensitive Data Logging

**Vulnerability:**
1. The `/api/deals/internal/migrate` endpoint was publicly accessible and executed shell commands (`prisma migrate dev`), posing a Remote Code Execution (RCE) risk.
2. The `updateUser` controller logged the entire request body, including plaintext passwords, to the server console.

**Learning:**
Internal maintenance routes and debugging logs often bypass standard security middleware during rapid development phases. In this case, `authenticateToken` was missing from the migration route, and verbose logging was left in production-ready code.

**Prevention:**
1. Always apply a "secure by default" approach to all new routes.
2. Use middleware stacks for entire routers when possible (`router.use(authenticateToken)`).
3. Implement a logging policy that explicitly forbids logging `req.body` in routes handling credentials or personally identifiable information (PII).
4. Regularly audit routes for missing authorization (`authorizeRole`).
