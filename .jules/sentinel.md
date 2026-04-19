## 2024-05-23 - Unauthenticated Migration Endpoint
**Vulnerability:** Unauthenticated GET route `/internal/migrate` was executing shell commands via `child_process.exec`.
**Learning:** Internal testing or migration endpoints are sometimes accidentally left unprotected in production.
**Prevention:** Ensure all internal or administrative Express routes are protected by both `authenticateToken` and `authorizeRole('admin')` middleware.
