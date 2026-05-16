## 2025-05-15 - [Sanitize Logging]
**Vulnerability:** Sensitive data (passwords, PII) were being exposed in application logs through raw `req.body` and `req.params` logging in `userController.js` and `clientPropertyController.js`.
**Learning:** Developers often leave verbose debug logging in controllers that can leak sensitive information to persistent log files or console output.
**Prevention:** Always sanitize request objects before logging. Avoid logging entire `req.body` objects, especially in authentication or user management endpoints. Use object destructuring to exclude sensitive fields.
