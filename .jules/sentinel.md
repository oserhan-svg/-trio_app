## 2025-05-15 - [Admin Password Reset on Startup]
**Vulnerability:** Initial admin creation script `server/scripts/createAdminPrisma.js` used `upsert()` with a hardcoded password ('1234'), causing the admin password to be reset to this insecure default every time the server restarted.
**Learning:** Over-reliance on "initialization" scripts that run on every startup can inadvertently undo security changes made by users (like password updates).
**Prevention:** Initialization scripts should check for the presence of existing data before attempting to create "default" records, and should never overwrite sensitive user data like passwords once established.
