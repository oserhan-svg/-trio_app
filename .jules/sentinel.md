## 2024-05-28 - Fix missing authentication on internal migration endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint executed `child_process.exec` without any authentication middleware.
**Learning:** Internal or testing routes are sometimes left unprotected, leading to RCE/Command Injection vulnerabilities.
**Prevention:** Internal routes executing shell commands must always be protected with both `authenticateToken` and `authorizeRole('admin')` or removed from production completely.
