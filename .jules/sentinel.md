## 2024-03-18 - Missing Authentication on Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` was accessible to anyone.
**Learning:** This could allow an attacker to run database migrations, execute system commands using `exec` and potentially wipe out database or denial of service by triggering endless migrations.
**Prevention:** Always secure internal system maintenance and migration endpoints with strict authentication and role-based authorization (e.g., `authenticateToken`, `authorizeRole('admin')`). Always make sure imports match exactly when introducing auth middleware to existing routing files.
