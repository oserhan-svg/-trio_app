## 2024-05-18 - RCE Vulnerability in Deal Routes
**Vulnerability:** Command Injection/RCE in `server/controllers/dealController.js` via `runInternalMigration`.
**Learning:** Development/migration endpoints left in production code without any authentication or authorization allow unauthenticated users to execute arbitrary commands on the server.
**Prevention:** Remove internal testing/migration routes from production builds, or strictly protect them with both authentication and strict admin authorization (`authenticateToken` and `authorizeRole('admin')`).
