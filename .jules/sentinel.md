## 2025-05-14 - Hardcoded Admin Credentials in Seeding Script
**Vulnerability:** The `server/scripts/createAdminPrisma.js` script contained hardcoded admin email and a weak password ('1234'), exposing sensitive credentials in the source code.
**Learning:** Initial setup or seeding scripts are often overlooked for security, but they can be a major source of credential leakage if they hardcode "default" passwords.
**Prevention:** Always use environment variables for any credentials, even in setup scripts. Implement checks to ensure these variables are present and initialize `dotenv` explicitly in standalone scripts.
