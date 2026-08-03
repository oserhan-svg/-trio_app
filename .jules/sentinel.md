## 2024-05-30 - Unauthenticated Utility Endpoints and Information Disclosure
**Vulnerability:** Internal utility endpoints (like `/internal/migrate`) were exposed without authentication and leaked system information (`stderr`/`stdout`) when executing shell commands.
**Learning:** Developers might create internal utility routes for tasks like database migrations and forget to secure them because they aren't part of standard CRUD operations. Furthermore, returning raw command output for debugging directly exposes internal server paths.
**Prevention:** Always apply the `isAdmin` middleware to any endpoint that executes server-side administrative tasks. Sanitize all error responses to remove raw output (like `stderr`) before returning them to the client.
