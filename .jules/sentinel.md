## 2024-05-02 - Unprotected Internal Migration Route
**Vulnerability:** The `/api/deals/internal/migrate` route executes database migrations using `child_process.exec` but lacks any authentication or authorization checks.
**Learning:** Testing and internal administrative routes are sometimes left unprotected during development, creating significant security risks if exposed in production.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` middleware to any route executing shell commands or internal administrative scripts.
