## 2024-05-18 - [Fix N+1 Query Bottleneck in aiRoutes]
**Learning:** Sequential Prisma `.count()` calls on different models block each other and artificially increase database response time.
**Action:** Always batch independent Prisma aggregate queries using `Promise.all` to run them concurrently.
