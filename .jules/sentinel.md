## 2026-05-05 - Missing Role Authorization on Admin Stats
**Vulnerability:** The `/api/admin/stats` endpoint was only protected by `authenticateToken`, allowing any authenticated user (including consultants) to view system-wide administrative statistics.
**Learning:** While the route was authenticated, it lacked a secondary authorization check for the 'admin' role, highlighting a gap in the defense-in-depth strategy for administrative endpoints.
**Prevention:** Always apply both `authenticateToken` and `authorizeRole('admin')` (or use a combined `isAdmin` middleware) to all routes under the `/api/admin` namespace.
