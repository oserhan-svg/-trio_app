## 2024-07-23 - Add isAdmin middleware to admin routes
**Vulnerability:** Admin endpoints like `/api/admin/stats` only used `authenticateToken` rather than checking if the authenticated user was an administrator.
**Learning:** Proper role-based access control was missing on sensitive admin routes.
**Prevention:** Always use the `isAdmin` middleware rather than just `authenticateToken` on admin routes.
