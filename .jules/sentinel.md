## 2024-05-18 - Protect internal migration route
**Vulnerability:** Unauthenticated internal route allowed running database migrations via child_process.exec.
**Learning:** Exposing internal tooling endpoints without authentication/authorization can lead to remote code execution or application state disruption.
**Prevention:** Ensure all internal routes are removed in production or strictly protected with admin role requirements.
