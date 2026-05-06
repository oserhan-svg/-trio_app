## 2026-05-06 - [RCE] Unprotected Internal Migration Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely unprotected, allowing anyone to trigger shell commands (prisma migrate) without authentication or authorization.
**Learning:** Internal utility endpoints, especially those that interact with the system shell or database schema, are often overlooked during security audits but pose the highest risk (RCE).
**Prevention:** Always apply at least `authenticateToken` and `authorizeRole('admin')` to any endpoint that executes shell commands or performs administrative tasks. Implement defense-in-depth with environment-secret keys for critical operations.
