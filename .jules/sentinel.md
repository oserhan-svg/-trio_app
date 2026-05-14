## 2025-05-15 - Unauthenticated RCE via Migration Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was a `GET` route without authentication, executing shell commands via `child_process.exec`.
**Learning:** Internal utility routes often bypass standard security reviews and can expose critical system functions if left unprotected.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to any route that performs system-level operations or executes shell commands. Use `POST` for state-changing operations and implement defense-in-depth with secondary header keys.
