## 2025-02-27 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` was completely unauthenticated and allowed executing raw shell commands (`exec`) for database migrations.
**Learning:** Internal tooling endpoints can easily be left exposed if not properly audited, leading to severe risks like RCE or DB corruption.
**Prevention:** Always apply authentication (`authenticateToken`) and role-based authorization (`isAdmin`) to all internal and administrative endpoints by default.
