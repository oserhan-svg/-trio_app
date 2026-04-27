## 2026-04-27 - Unauthorized Migration Endpoint (RCE)
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely unprotected and executed shell commands (`prisma migrate`).
**Learning:** Internal maintenance routes are often overlooked when applying global or group-level authentication middleware, leading to serious Remote Code Execution (RCE) risks.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to any route that interacts with the system shell or performs destructive database operations.

## 2026-04-27 - Sensitive Data Leakage in Logs
**Vulnerability:** The `updateUser` controller logged the entire `req.body`, including plain-text passwords, to the console during user updates.
**Learning:** Verbose logging for debugging purposes can inadvertently capture and store sensitive user credentials in server logs.
**Prevention:** Sanitize or omit sensitive fields (password, tokens, etc.) from log statements. Avoid logging raw request bodies in production-ready code.
