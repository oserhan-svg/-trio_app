## 2024-05-24 - Admin Stats Endpoint Lacks Admin Authorization
**Vulnerability:** The `/api/admin/stats` endpoint only validates `authenticateToken`, meaning any logged-in user can access admin dashboard stats.
**Learning:** Relying on simple token authentication instead of role-based authorization for administrative routes exposes sensitive analytical data and admin functions.
**Prevention:** Use `isAdmin` or `authorizeRole('admin')` explicitly on all routes mapped under `/api/admin`.
