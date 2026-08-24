## 2024-10-24 - Missing Auth on Exec Endpoint
**Vulnerability:** Unauthenticated access to `/api/deals/internal/migrate` which runs `child_process.exec` and leaked `stderr`/`stdout`.
**Learning:** Routes using per-route authentication (instead of `router.use()`) are prone to missing auth on newly added internal or debug endpoints.
**Prevention:** Always apply authentication middleware globally at the router level when possible, or strictly enforce it on every route, and never return raw `stderr`/`stdout` to the client.