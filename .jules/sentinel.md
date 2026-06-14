## 2024-10-24 - Over-Permissive CORS with Credentials
**Vulnerability:** Express and Socket.io both used permissive fallbacks (`callback(null, true)`) for unknown origins while `credentials: true` was enabled.
**Learning:** The codebase implemented "soft allowing" for new origins during development but left this in production alongside credential support, exposing the app to cross-origin data leaks and CSRF attacks.
**Prevention:** Always explicitly deny unknown origins in CORS callbacks (`callback(new Error('Not allowed by CORS'))`) when credentials are enabled. Do not use open fallbacks.