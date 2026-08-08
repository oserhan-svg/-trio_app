## 2024-10-31 - Missing Authentication on Internal Commands
**Vulnerability:** The `/internal/migrate` endpoint executed `child_process.exec` without authentication and leaked `stderr` in the response.
**Learning:** Internal tool routes are sometimes created during development and left unprotected, exposing shell execution and server environment details.
**Prevention:** Always apply `isAdmin` to administrative endpoints and sanitize error responses (`stderr`) in utility routes to avoid leaking internal stack traces.