## 2024-10-24 - Remove Unauthenticated Command Execution Route
**Vulnerability:** Unauthenticated internal migration route (`/internal/migrate`) executing `child_process.exec`.
**Learning:** Development/testing routes were left in production code without authentication or role-based authorization, exposing a shell command execution vector.
**Prevention:** Internal or testing routes must be completely removed from production builds or strictly protected with both `authenticateToken` and `authorizeRole('admin')` to prevent RCE vulnerabilities.