## 2025-05-08 - Unauthorized Command Injection Vulnerability in Deal Routes
**Vulnerability:** The route `/api/deals/internal/migrate` executes a shell command (`prisma migrate dev`) using `child_process.exec` without any authentication or authorization middleware.
**Learning:** Any user or attacker could trigger arbitrary database migrations, leading to potential denial of service or schema corruption. Internal testing or admin-only routes must be protected with strict authentication and authorization checks.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to sensitive, internal, or administrative routes, especially those invoking system commands or shell scripts.
