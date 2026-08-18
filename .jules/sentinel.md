## 2024-08-19 - Missing Authentication on Internal Shell Route
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed a shell command via `child_process.exec` without any authentication middleware, and leaked `stderr`/`stdout` directly to the client.
**Learning:** Internal administrative routes were added without the `isAdmin` middleware, exposing potentially destructive capabilities and sensitive server details.
**Prevention:** Always ensure utility or internal routes have strict `isAdmin` (or equivalent) checks, and never return raw `stderr`/`stdout` in HTTP responses.
