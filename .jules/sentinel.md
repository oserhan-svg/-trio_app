## 2024-05-01 - Unauthenticated Utility Endpoints with Command Execution
**Vulnerability:** Found an unauthenticated endpoint (`/api/deals/internal/migrate`) that executes `child_process.exec` and leaks raw `stderr` or `stdout` in the response.
**Learning:** Utility endpoints, even if intended for internal use, must be protected with strong authentication (e.g., `isAdmin`). In addition, raw command output should never be passed back to the client directly to avoid leaking sensitive internal paths or stack traces.
**Prevention:** Always wrap internal utility endpoints with `isAdmin` middleware. Sanitize error responses by stripping out detailed system information before sending the JSON response.
