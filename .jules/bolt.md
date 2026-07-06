## 2024-07-06 - Eliminate Sequential N+1 Prisma Queries
**Learning:** Sequential, independent `prisma.*.count()` database queries are a common anti-pattern that creates an N+1 performance bottleneck.
**Action:** When multiple independent queries are needed, batch them together using `Promise.all()` to run concurrently and significantly reduce response latency.
