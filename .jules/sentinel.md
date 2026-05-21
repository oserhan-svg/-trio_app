## 2024-05-24 - Remove unauthenticated internal migration endpoint
**Vulnerability:** A route `/internal/migrate` mapped to `dealController.runInternalMigration` exposed `child_process.exec` without any authentication or authorization checks.
**Learning:** Development or internal testing routes that execute shell commands or database migrations must never be committed and exposed in production without strict authentication and role-based authorization (e.g., `authenticateToken` and `authorizeRole('admin')`). They pose a significant Command Injection and RCE risk.
**Prevention:** Remove such routes completely from production code or ensure they are protected with strict admin authorization.
