## 2024-05-12 - Protect Internal Routes Calling Shell Commands
**Vulnerability:** Unauthenticated internal migration route `/internal/migrate` executing `child_process.exec`.
**Learning:** Internal testing routes left in production without authentication can be triggered by anyone, posing DoS and potential RCE risks.
**Prevention:** Always remove internal routes from production or protect them strictly with `authenticateToken` and `authorizeRole('admin')`.
