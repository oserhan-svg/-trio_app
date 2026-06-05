## 2024-06-05 - Optimize Analytics Endpoint
**Learning:** Sequential database queries and service calls in dashboard controllers (like `getStats`) can cause significant N+1 delays, especially when they are entirely independent.
**Action:** Always group independent `await prisma...` counts and service requests into `Promise.all()` to resolve them concurrently and improve API response times.