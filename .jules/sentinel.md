## 2025-04-23 - [Unauthenticated Migration Endpoint with RCE potential]
**Vulnerability:** An unauthenticated endpoint `/api/deals/internal/migrate` was discovered that used `child_process.exec` to run Prisma migrations.
**Learning:** Internal utility endpoints, especially those involving shell commands, are often overlooked during security reviews.
**Prevention:** Always apply at least admin-level authentication to any endpoint that executes shell commands or modifies database schema at runtime.
