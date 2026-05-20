## 2025-05-15 - Secured Internal Migration Route
**Vulnerability:** The `/api/deals/internal/migrate` route was completely unprotected, allowing anyone to trigger a database migration that executed shell commands.
**Learning:** Internal utility routes often bypass standard security middleware if not explicitly included in the initial implementation.
**Prevention:** Always apply `authenticateToken` and appropriate `authorizeRole` middleware to all routes by default, especially those performing system-level operations.

## 2025-05-15 - Sanitized User Update Logs
**Vulnerability:** The `updateUser` controller logged the entire `req.body`, which could contain plaintext passwords during a password update.
**Learning:** Verbose logging for debugging can inadvertently leak sensitive user data if not properly sanitized.
**Prevention:** Destructure request bodies in logs to explicitly exclude sensitive fields like `password`, `token`, or `credit_card`.
