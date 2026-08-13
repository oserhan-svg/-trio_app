## 2024-08-12 - Prevent Information Disclosure via Error Output
**Vulnerability:** Leaking raw `stderr` and internal error messages from `child_process.exec` in the `/internal/migrate` endpoint.
**Learning:** Internal tooling routes sometimes mistakenly pass unhandled shell output directly to the HTTP response, which exposes internal environment details or stack traces to any client calling the endpoint.
**Prevention:** Always sanitize output from system execution commands and return a generic error message to clients, logging the detailed output securely server-side.
