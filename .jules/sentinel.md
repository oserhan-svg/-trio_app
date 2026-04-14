## 2024-04-14 - Unauthorized Internal Migration Route
**Vulnerability:** Unauthenticated GET route `/api/deals/internal/migrate` exposed an endpoint that executes a database migration via `child_process.exec`.
**Learning:** Internal testing or migration endpoints can be left behind during development and inadvertently expose shell command execution to unauthenticated external users.
**Prevention:** Ensure all internal or administrative routes are either removed before production or strictly protected with both `authenticateToken` and `authorizeRole('admin')` middleware.