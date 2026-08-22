## 2024-08-22 - Unauthenticated Shell Command Execution and Info Disclosure in Migration Route
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` lacked authentication and executed shell commands (`exec`), while also exposing `stderr` and `stdout` in the HTTP response.
**Learning:** Internal tool routes (like migrations) are often added during development without standard authentication middleware, and error responses from shell commands frequently leak internal stack traces or environment paths.
**Prevention:** Always secure internal utility routes with strict authentication (e.g., `isAdmin`), and never return raw `stderr`/`stdout` from shell executions to the client.
