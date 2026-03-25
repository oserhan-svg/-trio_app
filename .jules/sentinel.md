## 2024-05-18 - Authorization Bypass in Internal Migration API
**Vulnerability:** An internal API route (`/internal/migrate`) triggered a `child_process.exec` command but was exposed without any authentication or authorization middleware in the Express router.
**Learning:** Even if a route is prefixed with "internal", it is still externally accessible if not protected by middleware. Any utility or diagnostic endpoints must explicitly require `authenticateToken` and usually `authorizeRole('admin')` to prevent unauthorized execution.
**Prevention:** Always audit the router definitions to ensure that *every* route uses authentication middleware unless intentionally public. Never expose system command execution points without verifying both identity and administrative role.
