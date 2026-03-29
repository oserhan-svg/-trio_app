## 2024-05-18 - Unauthenticated Command Execution Vulnerability in Internal Migration Route
**Vulnerability:** Found an unauthenticated route `/internal/migrate` in `server/routes/dealRoutes.js` that directly executes a database migration via `child_process.exec`.
**Learning:** Internal endpoints that wrap or trigger external shell commands (like migrations) are dangerous attack vectors for Remote Code Execution (RCE) and Denial of Service (DoS) if left unprotected, even if they're "hidden".
**Prevention:** Ensure all internal administrative endpoints are strictly protected by both authentication (`authenticateToken`) and strong authorization (`authorizeRole('admin')`) middleware. Never assume an endpoint is safe just because it's not documented or linked in the UI.
