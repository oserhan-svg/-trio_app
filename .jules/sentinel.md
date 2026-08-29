## 2024-05-19 - Unauthenticated Internal Route Leaking Command Output
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` lacked authentication middleware, exposing a child process command execution that leaked internal `stderr` details.
**Learning:** Internal maintenance endpoints must explicitly include authorization (e.g., `isAdmin`), as relying on obscurity doesn't protect the API layer.
**Prevention:** Always apply `isAdmin` to maintenance endpoints and explicitly sanitize `child_process.exec` error responses instead of returning raw `stderr` or `stdout`.