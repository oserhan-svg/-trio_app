# Sentinel Security Journal

## 2025-05-14 - Sensitive Data Exposure in Logs
**Vulnerability:** The `updateUser` controller in `server/controllers/userController.js` was logging the full request body, including plain-text passwords, during user updates.
**Learning:** Developers often add verbose logging for debugging purposes (e.g., tracking user update payloads) without considering that these logs might contain sensitive credentials that persist in log files or monitoring systems.
**Prevention:** Always create a redacted copy of the request body or specific sensitive fields before logging. Use a whitelist or blacklist approach for logging payloads that might contain credentials.

## 2025-05-14 - Admin Password Reset Vulnerability
**Vulnerability:** The `createAdminPrisma.js` script was resetting the admin password to a hardcoded default ('1234') on every server restart via an `upsert` call.
**Learning:** Automated initialization scripts that use `upsert` must be careful not to overwrite sensitive fields like `password_hash` if the record already exists, unless explicitly intended.
**Prevention:** Remove `password_hash` from the `update` block of an `upsert` call if the field should only be set during creation, or use a conditional check before updating.

## 2025-05-14 - Hardcoded Secrets in Documentation
**Vulnerability:** A hardcoded API key (`WEBSHARE_API_KEY`) was found in `server/PROXY_SETUP.md`.
**Learning:** Documentation and setup guides often contain example keys that can accidentally be real keys or be mistaken for them.
**Prevention:** Use placeholders like `your_api_key_here` in documentation and ensure `.env` files are the sole source of truth for secrets.
