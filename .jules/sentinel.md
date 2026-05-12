## 2025-05-15 - Unprotected RCE Endpoint Securing
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was an unauthenticated GET route that executed shell commands (`prisma migrate`).
**Learning:** System-level operations (like migrations) should never be exposed as GET requests and must always require high-privilege authentication.
**Prevention:** Use POST for state-changing or system-level operations, wrap with `authenticateToken` and `authorizeRole('admin')`, and implement defense-in-depth via secondary header keys for sensitive execution points.
