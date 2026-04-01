## $(date +%Y-%m-%d) - Protect internal migration route
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` (which executes `child_process.exec` to run Prisma migrations) lacked any authentication or authorization middleware, exposing it to unauthenticated trigger attacks.
**Learning:** Internal or testing routes must not be left unprotected, as they can be exploited for DoS or command injection if parameters change in the future.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to administrative or internal endpoints before merging.
