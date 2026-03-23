## 2024-05-23 - Parallelize Prisma Aggregation Queries
**Learning:** Sequential, independent database queries (especially `prisma.count` or other aggregations) can cause significant N+1-style latency bottlenecks. In dashboard and analytics controllers, these separate count queries for dashboard statistics block the event loop and compound database latency.
**Action:** Always group independent Prisma database queries using `Promise.all()` to execute them concurrently, reducing total query time from O(N) to roughly O(1) in latency terms.
