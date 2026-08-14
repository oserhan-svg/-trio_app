## 2024-05-14 - Missing Admin Authorization on Admin Routes
**Vulnerability:** The `/api/admin/stats` endpoint in `server/routes/adminRoutes.js` was using `authenticateToken` instead of `isAdmin`, allowing any authenticated user (even non-admins) to access administrative dashboard statistics.
**Learning:** The `isAdmin` middleware wraps `authenticateToken` and correctly verifies the user role. Relying only on `authenticateToken` for routes intended for administrators results in an authorization bypass.
**Prevention:** Always use `isAdmin` for endpoints inside `adminRoutes.js` and double-check route definitions to ensure role-based access control is properly enforced.
