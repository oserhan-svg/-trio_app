## 2026-04-21 - Concurrent Prisma Queries
**Learning:** Independent Prisma queries (like counts for different dashboard metrics) were being awaited sequentially, causing latency bottlenecks (sum of execution times).
**Action:** Always group independent Prisma queries and execute them concurrently using `Promise.all()` to bound execution time to the maximum of individual query times.
