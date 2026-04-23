## 2024-05-24 - [Unauthenticated Command Execution Vulnerability in Internal Migration Route]
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed `child_process.exec()` without any `authenticateToken` or `authorizeRole` middleware.
**Learning:** Internal endpoints that run shell commands or administrative tasks must be strictly protected, otherwise they can be exploited by unauthenticated users to execute arbitrary code or unauthorized database migrations.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` middleware to any internal or administrative Express routes, especially those that interact with `child_process` or perform system-level operations.
