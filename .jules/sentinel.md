## 2025-05-15 - [Secure Internal Migration & Redact Logs]
**Vulnerability:** Unprotected system-level endpoint `/api/deals/internal/migrate` (RCE risk) and sensitive data exposure in `updateUser` logs.
**Learning:** System operations like migrations should never be exposed via GET and lack authentication. Logging `req.body` in user updates leaks plain-text passwords.
**Prevention:** Use POST for sensitive operations, wrap with `authenticateToken` and `authorizeRole('admin')`, and implement secondary header validation for defense-in-depth. Explicitly redact sensitive fields before logging request bodies.
