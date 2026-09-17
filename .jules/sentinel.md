## 2024-05-18 - Unauthenticated Command Execution Risk
**Vulnerability:** The `/internal/migrate` endpoint exposed a child process execution (`exec('prisma migrate dev')`) without any authentication or authorization middleware.
**Learning:** Development and migration endpoints added for convenience are occasionally left entirely exposed to the public. Because the `dealRoutes.js` file required authentication for standard API actions but not the `internal` route, an unauthenticated attacker could trigger a database migration script, causing a DoS or corrupting state.
**Prevention:** Always apply at least `isAdmin` (or an equivalent strict authorization middleware) to any route that performs server-side command execution or administrative tasks, regardless of its `/internal` path namespace.
