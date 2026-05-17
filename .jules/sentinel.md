## 2026-05-16 - Unauthenticated RCE on internal migrate route
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` uses `child_process.exec` to run Prisma commands, and it completely lacked authentication and authorization checks.
**Learning:** Internal or testing routes that execute shell commands are highly dangerous if left unprotected. They provide a direct path to Remote Code Execution (RCE) and Command Injection.
**Prevention:** Ensure all internal, administrative, or diagnostic Express routes are strictly protected by both `authenticateToken` and `authorizeRole('admin')` middleware.
