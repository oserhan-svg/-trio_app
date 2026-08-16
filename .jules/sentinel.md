## 2026-08-15 - Unauthenticated Internal Command Execution
**Vulnerability:** The `/internal/migrate` endpoint in deal routes was unauthenticated and executed a shell command (`prisma migrate`) while leaking raw `stderr` and internal error messages to the client.
**Learning:** Internal tooling routes added for convenience during development are sometimes left unauthenticated in production, leading to critical risk when they execute shell commands or leak environment details.
**Prevention:** Always secure internal utility endpoints with `isAdmin` middleware, and never return raw `stderr` or unhandled error messages to the client from `child_process.exec` calls.
