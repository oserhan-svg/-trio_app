## 2024-07-21 - Batching independent Prisma counts
**Learning:** Making multiple independent `await prisma.*.count()` calls sequentially introduces an N+1 bottleneck, which significantly increases response times in dashboard/analytics endpoints.
**Action:** Always batch these independent Prisma queries using `Promise.all` to run them concurrently.
