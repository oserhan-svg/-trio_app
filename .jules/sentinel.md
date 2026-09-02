## 2024-09-02 - Missing Authorization on Admin Endpoint
**Vulnerability:** The `/api/admin/stats` endpoint only verified authentication, lacking role-based access control, which allowed any authenticated user to view admin statistics.
**Learning:** The custom `isAdmin` middleware in this codebase internally wraps and executes `authenticateToken`. Securing admin routes requires using `isAdmin` alone, rather than chaining `authenticateToken` and `isAdmin`, to prevent duplicate authentication checks.
**Prevention:** Always verify that admin-specific endpoints utilize the `isAdmin` middleware instead of generic authentication.
