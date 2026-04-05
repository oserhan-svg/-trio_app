## 2025-05-14 - Chrome Extension Endpoint Security
**Vulnerability:** Several Chrome extension-facing endpoints (`/api/scraper/import`, `/api/scraper/finished`, `/api/whatsapp/extension-sync`) were completely unprotected, allowing arbitrary data injection.
**Learning:** Extension-to-Server communication often falls into a "trust by default" trap because it's not a standard user-facing flow. Explicit API key validation is essential even for internal tools.
**Prevention:** Always implement a `fail-secure` middleware (like `extensionAuth`) that disables access if the server-side secret is missing, and ensure it's applied to all non-standard client routes.

## 2025-05-14 - CORS Soft-Allow Regression
**Vulnerability:** The CORS configuration logged unauthorized origins but allowed them anyway ("soft allow"), rendering the whitelist ineffective.
**Learning:** Logging a security event is not a substitute for enforcing the policy. In middleware like `cors`, the callback must return an Error to actually block the request.
**Prevention:** Use automated tests to verify that unauthorized origins are strictly rejected with a non-200 status or a CORS error.
