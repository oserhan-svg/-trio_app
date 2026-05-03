## 2025-05-15 - [Authorization Bypass and Sensitive Data Exposure]
**Vulnerability:** The `/api/admin/stats` route was accessible to any authenticated user (consultants), and user passwords were being logged in plain text during updates.
**Learning:** Middleware chains must explicitly include authorization checks for administrative routes. Sensitive fields in request bodies must be redacted before being passed to logging functions.
**Prevention:** Implement a standard "adminOnly" middleware composition or ensure `authorizeRole('admin')` is always present on sensitive endpoints. Use a request logging interceptor or utility that automatically masks fields like `password`, `secret`, and `token`.
