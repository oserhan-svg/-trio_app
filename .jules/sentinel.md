## 2024-05-24 - Fix Overly Permissive CORS Configurations
**Vulnerability:** CORS configured to dynamically echo back the Origin and allow credentials (cookies, tokens) for unknown/any origin.
**Learning:** Returning `callback(null, true)` as a fallback for unrecognised origins when `credentials: true` allows malicious sites to perform authenticated cross-origin requests.
**Prevention:** Always explicitly deny unknown origins by returning `callback(new Error('Not allowed by CORS'))` when an origin does not match allowed patterns, especially with `credentials: true`.
