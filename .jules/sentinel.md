## 2024-05-18 - [Overly Permissive CORS with Credentials]
**Vulnerability:** The CORS configuration in `server/index.js` was softly allowing any origin (`callback(null, true)`) while simultaneously having `credentials: true`. This allows malicious websites to make authenticated requests to the API on behalf of logged-in users.
**Learning:** Returning `callback(null, true)` for unknown origins effectively acts as a wildcard `*` but bypasses the browser restriction that prevents `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`.
**Prevention:** Always explicitly deny unknown origins using `callback(new Error('Not allowed by CORS'))` when `credentials: true` is enabled.
