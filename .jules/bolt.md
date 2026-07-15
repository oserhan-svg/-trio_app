## 2024-05-24 - Batching Prisma Count Queries
**Learning:** In the Node.js backend, making multiple independent `await prisma.*.count()` calls sequentially introduces an N+1 bottleneck.
**Action:** Always batch these independent Prisma aggregate queries using `Promise.all` to run them concurrently and reduce database latency.
