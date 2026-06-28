## 2024-06-27 - CORS Over-permissiveness
**Vulnerability:** CORS configured to allow any origin (softly allowing with `callback(null, true)`) while simultaneously allowing credentials (`credentials: true`), which is a significant security risk for CSRF.
**Learning:** Overly permissive CORS with credentials exposes user sessions.
**Prevention:** Strictly enforce allowed origins and reject others with `callback(new Error('Not allowed by CORS'))`.
