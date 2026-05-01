## 2024-05-01 - Concurrent DB Queries for Metric Aggregation
**Learning:** When calculating metrics or aggregating multiple independent statistics using Prisma in backend controllers, sequentially awaiting independent queries creates a latency bottleneck that scales linearly with the number of queries.
**Action:** Always use `Promise.all()` to execute independent database queries concurrently. When iterating over collections using `.map()`, wrap the inner grouped `Promise.all` inside the outer `Promise.all` to maximize concurrency.
