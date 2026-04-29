## 2025-05-22 - Sensitive Data Exposure in Logs
**Vulnerability:** Plaintext passwords were being logged in the `updateUser` function.
**Learning:** Logging `req.body` directly is dangerous as it can contain sensitive information like passwords or tokens.
**Prevention:** Always whitelist or blacklist fields when logging request bodies, or log only metadata like the keys present in the request.

## 2025-05-22 - Unprotected Internal Admin Routes
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was unauthenticated and executed shell commands.
**Learning:** Internal utility routes are often overlooked during security audits but can provide high-impact attack vectors like RCE.
**Prevention:** Ensure all routes, especially those performing system operations, have explicit authentication and authorization middleware applied.
