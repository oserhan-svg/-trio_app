
## 2024-05-24 - Unprotected Database Migration Endpoint
**Vulnerability:** The Express backend contained an unprotected route `/internal/migrate` in `server/routes/dealRoutes.js` that allowed unauthenticated users to execute `child_process.exec` commands running internal database migrations (`prisma migrate dev`).
**Learning:** Development or testing endpoints left in production code are a significant risk. Even though the endpoint executed a hardcoded command without user input concatenation, an unauthenticated user could trigger arbitrary migrations, leading to database state manipulation or a potential Denial of Service (DoS).
**Prevention:** Completely remove internal, testing, or development routes from production code. If an administrative route is truly necessary, strictly protect it with both `authenticateToken` and `authorizeRole('admin')` middleware.
