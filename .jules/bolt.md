## 2025-05-10 - Concurrently execute analytics metrics queries
**Learning:** In `analyticsController.js`, multiple independent database queries and service calls were executed sequentially, unnecessarily compounding their execution times and causing latency bottlenecks for the `/stats` endpoint.
**Action:** Always wrap independent async operations and sequential database calls in a `Promise.all()` to execute them concurrently and improve API response times.
