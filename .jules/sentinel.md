# Sentinel Journal - Security Learnings

## 2025-05-14 - Permissive CORS Policy
**Vulnerability:** The application had a "soft allow" CORS policy that logged unknown origins but still permitted them.
**Learning:** Permissive CORS policies can allow malicious websites to make requests to the API on behalf of authenticated users if not properly restricted, even with `credentials: true` (though browser protections apply, it's still a risk).
**Prevention:** Always use a strict whitelist for CORS and reject any origin not on the list.

## 2025-05-14 - Admin Password Reset on Startup
**Vulnerability:** The `createAdminPrisma.js` script was using `upsert` to reset the admin password to '1234' every time the server started.
**Learning:** Automated setup scripts should never overwrite existing sensitive data like passwords unless explicitly requested.
**Prevention:** Check for existence before creating default users, and never update passwords automatically on boot.
