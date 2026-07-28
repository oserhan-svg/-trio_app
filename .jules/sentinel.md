## 2024-10-25 - Unauthenticated Child Process Execution and Information Leak
**Vulnerability:** Unauthenticated endpoint `/internal/migrate` exposed `child_process.exec` (prisma migrations) and leaked raw `stderr`/`stdout` directly to the client.
**Learning:** Internal utility routes are sometimes deployed without proper authentication (`isAdmin`), and direct error forwarding from system commands leaks internal environment details and stack traces.
**Prevention:** Always secure internal utility routes with `isAdmin` and explicitly sanitize error responses by omitting raw `stderr`/`stdout` and `error.message`.
