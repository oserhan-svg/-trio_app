## 2024-05-24 - Unauthenticated Migration Endpoint
**Vulnerability:** The `/internal/migrate` route in `dealRoutes.js` lacked authentication and authorization, exposing an endpoint that runs `child_process.exec`.
**Learning:** Internal tooling and migration scripts must be strictly protected or removed in production to prevent RCE and unauthorized database modifications.
**Prevention:** Always wrap internal routes with `authenticateToken` and `authorizeRole('admin')`.
