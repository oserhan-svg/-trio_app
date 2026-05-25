## 2024-05-24 - Bolt: Optimize Analytics Queries
**Learning:** Sequential database queries and service calls in analytics controllers can cause significant latency bottlenecks, especially when multiple independent aggregations are required.
**Action:** Use `Promise.all()` to execute independent async data service calls and database queries concurrently to reduce response times.
