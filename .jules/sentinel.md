# Sentinel Security Journal 🛡️

This journal tracks critical security learnings and vulnerability patterns discovered in the Trio App codebase.

## 2025-05-15 - Admin Password Reset on Startup
**Vulnerability:** The `createAdminPrisma.js` script used an `upsert` operation that included `password_hash` in the `update` block, effectively resetting the admin password to '1234' every time the server restarted.
**Learning:** Hardcoded initialization scripts can inadvertently overwrite production data if not carefully implemented with `upsert` or "create-if-not-exists" logic that respects existing sensitive data.
**Prevention:** Always exclude sensitive fields like `password_hash` from the `update` block of an `upsert` in initialization scripts unless a reset is explicitly intended.

## 2025-05-15 - Plain-Text Password Exposure in Logs
**Vulnerability:** The `updateUser` function in `userController.js` logged the entire `req.body` using `console.log`, which included the plain-text `password` field when a user's password was being updated.
**Learning:** Logging entire request bodies for debugging purposes is a common pattern that frequently leads to sensitive data exposure.
**Prevention:** Redact sensitive fields (passwords, tokens, PII) from request bodies before logging, or avoid logging the body entirely in production.
