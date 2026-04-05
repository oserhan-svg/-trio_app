## 2024-05-18 - [CRITICAL] Unauthenticated Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed a shell command (`child_process.exec`) without any authentication or authorization checks.
**Learning:** Internal tool routes that execute shell commands or raw database queries are often overlooked and can become severe Remote Code Execution (RCE) vectors if accidentally exposed to production or unauthenticated users.
**Prevention:** Always secure all routes, especially internal or administrative ones, using robust authentication (`authenticateToken`) and strict role-based authorization (`authorizeRole('admin')`). Avoid `child_process.exec` in the application server if possible.
