## 2026-03-22 - Missing Authentication on Internal Migrations
**Vulnerability:** Found an unauthenticated `/internal/migrate` endpoint in `server/routes/dealRoutes.js` that executed shell commands (`prisma migrate dev`).
**Learning:** Any endpoint executing system commands, especially database migrations or maintenance tasks, must be rigorously protected. Leaving it exposed allows attackers to trigger internal tasks, potentially causing DoS (database locks, service restarts).
**Prevention:** Ensure all administrative and internal utility endpoints are protected by both `authenticateToken` and `authorizeRole('admin')` middleware. Do not expose internal CLI tools to the web unnecessarily.
