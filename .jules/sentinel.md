## 2026-05-22 - [IDOR & XSS Mitigation in CRM]
**Vulnerability:** IDOR (Insecure Direct Object Reference) in client and interaction controllers, plus XSS in interaction content.
**Learning:** Generic client-id routes were unprotected, allowing consultants to access any client data. The interaction controller also had a parameter name mismatch bug (clientId vs id).
**Prevention:** Use a centralized ownership middleware for all resource-specific routes and ensure consistent parameter naming across routes and controllers. Always sanitize user-provided text content at the controller level.
