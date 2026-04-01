## 2025-01-20 - Sequential ORM Queries Inside Iterations (N+1 Variant)
**Learning:** In backend controllers (`performanceController.js`), independent Prisma aggregation queries (`prisma.x.count`) within a `.map` loop create severe `O(N*M)` latency bottlenecks when left sequentially awaited.
**Action:** When aggregating multiple statistics simultaneously, always wrap the independent queries in an inner `Promise.all` array, and ensure the outer iteration mapping is also wrapped in an outer `Promise.all` to achieve maximum concurrency (`O(1)` theoretical database latency).
