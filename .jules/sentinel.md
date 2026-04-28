## 2024-05-24 - Unauthenticated Internal Command Execution Endpoint
**Vulnerability:** Found an unauthenticated endpoint `/internal/migrate` that executes arbitrary shell commands (`child_process.exec`).
**Learning:** Internal or testing routes must not be left exposed in production or accessible without strict authentication, as they are a vector for Command Injection and RCE.
**Prevention:** Always wrap internal administration routes with `authenticateToken` and `authorizeRole('admin')` middleware, or remove them entirely from production builds.