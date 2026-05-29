## 2024-05-29 - Restrictive CORS Configuration
**Vulnerability:** Permissive CORS fallback allowing unknown origins (`callback(null, true)`) while `credentials: true` is enabled.
**Learning:** When `credentials: true` is used, the backend must explicitly reject unknown origins rather than silently allowing them, as this opens up Cross-Site Request Forgery (CSRF) and credential-leaking risks.
**Prevention:** Always use `callback(new Error('Not allowed by CORS'))` for the fallback `else` case in CORS origin functions when handling authenticated sessions.
