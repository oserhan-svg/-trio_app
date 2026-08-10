## 2024-05-18 - Unauthenticated internal command execution and information leakage
**Vulnerability:** Unauthenticated `/internal/migrate` endpoint exposed internal `child_process.exec` command errors (`stderr`) and output (`stdout`) to clients.
**Learning:** Utility endpoints for system commands (like Prisma migrations) are often added without standard authentication middleware, and raw output from `exec` leaks environment details (like local paths, Node version, or database URLs).
**Prevention:** Always secure internal utility routes with strict role-based authentication (e.g., `isAdmin`) and explicitly sanitize all command outputs, returning generic error and success messages instead of raw `stdout`/`stderr`.
