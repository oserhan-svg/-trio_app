## 2025-05-18 - Secured Internal Migration Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` route was completely unprotected, allowing anyone to trigger a database migration that executes shell commands via `exec`.
**Learning:** Internal tooling routes added during development can easily be overlooked when applying security middleware, especially if they are placed in a new or less-frequented controller.
**Prevention:** Always apply `authenticateToken` and appropriate role-based authorization (e.g., `authorizeRole('admin')`) to any route that performs system-level operations or sensitive database migrations.
