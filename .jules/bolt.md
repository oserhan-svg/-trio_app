## 2024-04-27 - Concurrent independent DB queries
**Learning:** Sequential independent database queries inside loops (like `map`) create a severe N*M latency bottleneck.
**Action:** When calculating metrics or aggregating multiple independent statistics using Prisma in backend controllers, always group them using `Promise.all()` to execute concurrently instead of sequentially.
