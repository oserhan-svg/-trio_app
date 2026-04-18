## 2025-05-18 - Concurrent Count Queries
**Learning:** Grouping multiple sequential `prisma.count()` calls into a `Promise.all` executes them concurrently, avoiding latency bottlenecks that block the event loop sequentially.
**Action:** When calculating metrics or aggregating multiple independent statistics using Prisma in backend controllers, always use `Promise.all()` to execute them concurrently rather than sequentially.
