## 2024-04-19 - [CRITICAL] Unauthenticated Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed shell commands using `exec` without any authentication or authorization.
**Learning:** Internal endpoints that execute shell commands or raw migrations are critical RCE risks and must always be protected, even if intended for internal use only.
**Prevention:** Always wrap internal or administrative endpoints with both `authenticateToken` and `authorizeRole('admin')` middleware.
