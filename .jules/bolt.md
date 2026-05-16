## 2024-05-24 - Optimize Prisma Count Queries Concurrency
**Learning:** Found sequential Prisma database queries (`await prisma.property.count()`) in backend controllers causing unnecessary latency bottlenecks.
**Action:** When aggregating multiple independent statistics using Prisma in backend controllers, always use `Promise.all()` to execute them concurrently rather than sequentially.
