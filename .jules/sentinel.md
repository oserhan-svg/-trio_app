## 2025-02-23 - Internal Command Execution Endpoint Exposure
**Vulnerability:** The `/api/deals/internal/migrate` endpoint executed a shell command (`prisma migrate`) using `child_process.exec` without any authentication middleware, and leaked `stderr`/`stdout` directly in the HTTP response.
**Learning:** Internal utility routes often bypass standard security reviews, leaving administrative capabilities exposed to unauthorized access and leaking internal environment details via command output.
**Prevention:** Always apply strict role-based authentication (like `isAdmin`) to utility/internal endpoints and sanitize error responses to prevent leaking internal stack traces or command outputs (`stderr`).
