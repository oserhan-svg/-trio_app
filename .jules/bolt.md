## 2024-05-24 - Optimize Analytics Queries
**Learning:** Sequential DB queries like Prisma `count()` without dependencies cause latency bottlenecks.
**Action:** Group independent queries using `Promise.all()` to execute concurrently.
