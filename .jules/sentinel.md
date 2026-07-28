## 2024-10-24 - Unauthenticated System Execution and Info Leak
**Vulnerability:** The `/internal/migrate` route lacked authentication and the `exec` response directly exposed `stdout` and `stderr` to clients.
**Learning:** Internal/utility routes executing commands via `child_process.exec` are especially dangerous if left unprotected and verbose, as they can leak environment details or be triggered repeatedly by unauthorized actors. Also learned that `isAdmin` middleware internally wraps `authenticateToken`, so they shouldn't be chained.
**Prevention:** Always wrap internal utility routes with `isAdmin` middleware, and rigorously sanitize command output (never expose `stderr` or raw command output in API responses).
