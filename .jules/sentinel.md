## 2024-05-24 - Missing Authorization on Admin Stats Route
**Vulnerability:** The `/api/admin/stats` route only checks for authentication (`authenticateToken`), not authorization (`isAdmin`).
**Learning:** Any authenticated user can access the admin dashboard statistics, leaking system-wide property data, assignment counts, and scraping sources.
**Prevention:** Always use `isAdmin` middleware on routes under `/api/admin/` to restrict access strictly to administrators.
