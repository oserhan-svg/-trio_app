## 2025-04-25 - Unauthenticated Shell Execution Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was public and allowed execution of shell commands (`prisma migrate dev`) via `child_process.exec`.
**Learning:** Internal utility endpoints, especially those involving schema migrations or system calls, must be protected by authentication and strictly limited to administrative roles.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to routes that execute shell commands or modify system-level state.

## 2025-04-25 - Password Leakage in Logs
**Vulnerability:** `console.log(req.body)` was used in the `updateUser` controller, leaking plain-text passwords into server logs.
**Learning:** Logging entire request bodies is dangerous as it often includes PII or credentials.
**Prevention:** Avoid logging `req.body` directly. Log specific, non-sensitive fields if debugging is necessary.
