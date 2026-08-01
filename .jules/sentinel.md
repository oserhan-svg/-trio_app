## 2024-10-25 - [Information Leakage in Utility Route]
**Vulnerability:** Internal migration route leaked raw `stderr` and internal error messages, and lacked authentication.
**Learning:** Utility/admin routes that execute system commands can expose internal stack traces or environment details if error objects and outputs are directly serialized to the client response.
**Prevention:** Always sanitize error responses by removing raw command outputs, `stderr`, and `error.message`. Secure all administrative/internal routes with proper role-based middleware (e.g., `isAdmin`).
