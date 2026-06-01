## 2024-06-01 - Overly Permissive CORS with Credentials
**Vulnerability:** CORS configuration allowed any origin to connect while `credentials: true` was enabled.
**Learning:** Returning `callback(null, true)` for unknown origins completely defeats the purpose of CORS and exposes authenticated endpoints to CSRF and data theft from malicious sites.
**Prevention:** Always explicitly deny unknown origins with an error when configuring dynamic CORS, especially when allowing credentials.