## 2025-02-28 - Unauthenticated Shell Execution via Internal Routes
**Vulnerability:** The `/internal/migrate` route executed a shell command (`prisma migrate dev`) using `child_process.exec` without any authentication middleware, and leaked `stderr`/`stdout` back to the client.
**Learning:** Internal or utility endpoints in the application that are meant for administrative purposes were left unprotected by standard authentication or `isAdmin` middleware, exposing internal server state and allowing unauthorized command execution.
**Prevention:** Always apply `isAdmin` middleware to any route that performs internal operations or executes shell commands, and sanitize the response to avoid exposing raw system output or stack traces.
