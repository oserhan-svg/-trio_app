## 2023-10-25 - Unauthenticated Internal Command Execution & Output Leak
**Vulnerability:** The `/internal/migrate` route lacked authentication, allowing unauthorized users to execute database migrations, and the endpoint returned raw `stderr`/`stdout` in the JSON response.
**Learning:** Internal utility routes executing shell commands (`child_process.exec`) were added without middleware, exposing stack traces and command output which can leak sensitive environment details.
**Prevention:** Always wrap internal utility routes with `isAdmin` middleware and sanitize error responses by removing raw command outputs.
