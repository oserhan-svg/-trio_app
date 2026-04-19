## 2024-05-18 - Concurrent Independent Aggregations
**Learning:** Sequential Prisma `.count()` queries and independent service calls in analytics endpoints (e.g., `getStats`) can significantly degrade performance due to cumulative network and database latency, especially as dataset size grows.
**Action:** When aggregating multiple independent statistics in backend controllers, always use `Promise.all()` to execute them concurrently, reducing total execution time to the duration of the single longest query rather than the sum of all queries.
