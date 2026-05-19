## 2024-05-20 - Concurrent Prisma Queries in Controllers
**Learning:** Controllers calculating multiple metrics or aggregating statistics using independent Prisma queries or async data service calls (like counting properties across different sources) cause severe latency bottlenecks if executed sequentially.
**Action:** Always wrap independent async data service calls and `prisma` aggregations in `Promise.all()` to execute them concurrently, minimizing response latency.
