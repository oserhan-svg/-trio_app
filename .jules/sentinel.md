## 2024-05-25 - Fix overly permissive CORS configuration
**Vulnerability:** CORS configured to allow all origins implicitly via permissive fallback with `credentials: true`.
**Learning:** Returning `callback(null, true)` for unverified origins entirely defeats CORS when credentials are used, allowing CSRF and sensitive data exposure.
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`).
