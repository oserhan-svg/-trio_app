## 2024-07-02 - Enforce Strict CORS on Express and Socket.io

**Vulnerability:** The application was configured with an overly permissive CORS policy that blindly allowed all unknown origins, even when `credentials: true` was enabled in Express and Socket.io.
**Learning:** Developers sometimes use `callback(null, true)` as a fallback to avoid CORS errors during development or for unlisted clients, failing to realize this completely defeats CORS protections and allows unauthorized cross-origin requests.
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`) in dynamic origin validation, especially when cookies or credentials are in use.