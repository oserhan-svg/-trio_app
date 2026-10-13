## 2024-05-15 - Unauthenticated DB Migration Route
**Vulnerability:** A route `/api/deals/internal/migrate` was exposed without authentication, triggering `child_process.exec`.
**Learning:** Developer testing routes for database migrations can inadvertently be left in production code and provide dangerous functionality.
**Prevention:** Ensure database migrations are handled via CI/CD pipelines or CLI scripts, never exposed as HTTP endpoints.