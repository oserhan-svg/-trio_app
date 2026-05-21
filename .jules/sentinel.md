## 2025-05-15 - Unprotected RCE and Admin Exposure
**Vulnerability:** Publicly accessible administrative routes `/api/deals/internal/migrate` and `/api/admin/stats` exposed sensitive data and allowed unauthorized shell command execution (RCE).
**Learning:** Legacy or internal utility routes often bypass standard authentication middleware during rapid development, especially when added outside main feature controllers.
**Prevention:** Enforce a "Secure by Default" routing policy where all administrative or internal utility routers (like `adminRoutes.js`, `dealRoutes.js`) require `authorizeRole('admin')` at the router level or on every individual route.

## 2025-05-15 - Sensitive Data Exposure in Logs
**Vulnerability:** The `updateUser` controller logged the full `req.body`, including plain-text passwords during user updates.
**Learning:** Standard development logging (e.g., logging request bodies for debugging) often inadvertently captures PII or credentials if not specifically sanitized.
**Prevention:** Implement a standard log sanitization utility or pattern (destructuring to exclude sensitive keys) in all controllers that handle authentication, user management, or payment data.
