# Sentinel Security Journal

## 2025-05-14 - Admin Password Reset Vulnerability
**Vulnerability:** Hardcoded admin password reset on application startup in `server/scripts/createAdminPrisma.js`.
**Learning:** The use of `upsert` with a hardcoded password in the `update` block causes user-changed passwords to be overwritten whenever the server restarts.
**Prevention:** Remove sensitive fields like `password_hash` from the `update` block of `upsert` operations intended for initialization.

## 2025-05-14 - Sensitive Data Exposure in Logs
**Vulnerability:** Logging of `req.body` in `updateUser` controller leaked plain-text passwords.
**Learning:** Development-time logging of request bodies can inadvertently capture and store sensitive information like passwords or PII in server logs.
**Prevention:** Avoid logging entire request objects. Explicitly log only necessary, non-sensitive identifiers (e.g., user IDs).
