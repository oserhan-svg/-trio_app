## 2024-05-24 - Authorization Bypass in Admin and Setting Routes
**Vulnerability:** The `/stats` endpoint in `adminRoutes.js` and the `POST` endpoints in `settingRoutes.js` were using `authenticateToken` instead of `isAdmin`, allowing any authenticated user to access admin functionality and modify system settings.
**Learning:** Sensitive routes and data modifications must explicitly check for the `admin` role, not just valid authentication.
**Prevention:** Always verify that routes affecting system state or returning global analytical data utilize the `isAdmin` or `authorizeRole` middleware.