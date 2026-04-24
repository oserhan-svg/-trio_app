
## 2024-10-24 - Prisma Concurrent Queries
**Learning:** Multiple independent `prisma.*.count` queries running sequentially in controllers create unnecessary bottlenecks, particularly in data-aggregation endpoints. When nested within loops (e.g. `Promise.all(arr.map(async ...))`), the sequential waits inside each iteration exacerbate the latency.
**Action:** Always group independent Prisma database queries using `Promise.all()`. For loops, nest an inner `Promise.all()` for query resolution within an outer `Promise.all()` iterating over the items, enabling maximum concurrency and minimizing latency.
