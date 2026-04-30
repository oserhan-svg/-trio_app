# Sentinel Security Journal

## 2025-05-14 - Unauthenticated Migration Endpoint (RCE Risk)
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely unprotected, allowing anyone to trigger a database migration script that executes shell commands (`exec`) via the `dealController.runInternalMigration` function.
**Learning:** Internal utility routes or migration endpoints are often added quickly for development but can be easily forgotten, leaving a massive Remote Code Execution (RCE) or data disruption vector if they use shell commands.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to any route that performs system-level operations, database migrations, or executes shell commands.
