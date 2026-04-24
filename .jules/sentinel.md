## 2025-05-14 - Sensitive Data Leakage in Logs
**Vulnerability:** Plain-text passwords and other sensitive user data were being logged to the console during user update operations.
**Learning:** Developers often use verbose logging for debugging (`console.log(req.body)`) but forget to remove or sanitize these logs before deployment. This can lead to sensitive information being stored in log management systems or being visible to anyone with access to the server logs.
**Prevention:** Never log the entire `req.body` or `req.query` objects if they might contain sensitive fields like `password`, `token`, or `secret`. Use a allow-list approach for logging or implement a global log sanitizer that redacts known sensitive fields.
