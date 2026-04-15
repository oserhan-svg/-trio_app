## 2024-05-24 - Missing Authentication on Internal Migration Route
**Vulnerability:** Unauthenticated execution of database migration shell commands via `child_process.exec` in the `/api/deals/internal/migrate` endpoint.
**Learning:** Internal or testing routes are sometimes left exposed without proper authentication middleware during development, leading to potential DoS or unauthorized server state changes.
**Prevention:** Always protect administrative, testing, or internal endpoints with strict authentication (`authenticateToken`) and authorization (`authorizeRole('admin')`) middleware.