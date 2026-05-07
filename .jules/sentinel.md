## 2025-01-24 - Unprotected Internal Migration Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely unprotected, allowing any user (or even unauthenticated visitors) to trigger a database migration that executes shell commands via `child_process.exec`.
**Learning:** Internal maintenance endpoints can easily be overlooked during security audits, especially if they are added for convenience during development. The use of `exec` makes this a potential Remote Code Execution (RCE) vector.
**Prevention:** Always apply authentication and authorization middleware to all routes by default. Use a multi-layered security approach (Defense in Depth) for sensitive operations, such as requiring internal secret keys in headers and using safer HTTP methods like `POST`.
