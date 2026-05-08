## 2024-05-18 - Optimize sequential Prisma counts and service queries
**Learning:** Sequential Prisma queries and independent async data service calls block concurrency and increase latency.
**Action:** Always use Promise.all to execute independent queries concurrently rather than sequentially to avoid latency bottlenecks.
