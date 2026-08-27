## 2026-08-26 - [CRITICAL] Command Injection & Missing Auth in dealRoutes
**Vulnerability:** The `runInternalMigration` endpoint in `dealRoutes.js` executes shell commands using `exec`, exposes `stderr` and `stdout` directly in responses, and lacks any authentication middleware.
**Learning:** Internal/utility endpoints are often left unsecured by mistake, and passing raw `exec` output directly to clients leaks internal server structure/environment details.
**Prevention:** Always require administrative authentication (`authenticateToken`, `authorizeRole('admin')`) for utility endpoints and sanitize error messages to avoid leaking `stderr` or stack traces.
