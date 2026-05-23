## 2026-05-22 - Unauthenticated Database Migration Execution
**Vulnerability:** Unauthenticated API endpoint (`/internal/migrate`) executing shell commands (`child_process.exec`) for database migrations.
**Learning:** Development/testing routes left in production can lead to unauthorized command execution or Denial of Service (DoS) attacks.
**Prevention:** Strictly protect internal routes with `authenticateToken` and `authorizeRole('admin')` or remove them completely from production builds.
