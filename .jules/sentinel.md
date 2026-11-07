## 2026-11-07 - [HIGH] Remove Unauthenticated Command Execution Endpoint
**Vulnerability:** Found an unauthenticated endpoint at `/api/deals/internal/migrate` that executes a shell command (running Prisma migrations via `exec`).
**Learning:** Maintenance endpoints executing server commands must never be exposed without strict authentication and authorization. It provides unauthenticated access to run server operations, which is highly insecure and can lead to DoS or other issues.
**Prevention:** Avoid using `exec` or `spawn` for application endpoints. Maintenance tasks like database migrations should be handled out-of-band via CI/CD pipelines or secure admin scripts.
