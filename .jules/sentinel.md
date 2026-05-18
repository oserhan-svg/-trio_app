## 2024-05-18 - Remove Command Injection Risk in Internal Migrate Route
**Vulnerability:** Command Injection / RCE vulnerability via `child_process.exec` on an unprotected `/internal/migrate` route.
**Learning:** Internal testing endpoints that execute shell commands must be entirely removed from production or heavily restricted to admins, as they provide direct RCE vectors.
**Prevention:** Do not expose `child_process.exec` endpoints on the API server.
