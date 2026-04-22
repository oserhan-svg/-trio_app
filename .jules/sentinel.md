## 2025-02-15 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** An internal Express route (`/internal/migrate`) was completely unprotected and executed a shell command (`child_process.exec`) for database migration.
**Learning:** Development or internal testing endpoints are sometimes left exposed without authentication, risking unauthorized execution of sensitive shell commands or database operations.
**Prevention:** All internal or administrative Express routes must be strictly protected with both `authenticateToken` and `authorizeRole('admin')` middleware, or removed entirely from production.
