## YYYY-MM-DD - Remove unauthenticated internal migration endpoint
**Vulnerability:** A route `/internal/migrate` on `dealRoutes.js` allowed any user to trigger shell commands (`exec`) by visiting the endpoint. Even worse, it executed without any authentication or authorization (`isAdmin`).
**Learning:** Legacy debug or migration endpoints are sometimes accidentally left in production code without proper access controls, creating command injection or unauthorized execution risks.
**Prevention:** Always require authentication on all API routes, and completely remove internal migration/debug scripts from production routing files.
