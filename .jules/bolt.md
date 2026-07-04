## 2024-07-04 - Fix N+1 queries in admin and analytics stats
**Learning:** Sequential `prisma.*.count` calls create N+1 bottlenecks.
**Action:** Batch them using `Promise.all` to run concurrently and reduce overhead.
