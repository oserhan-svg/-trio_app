## 2024-04-26 - Concurrent Prisma Query Execution in Maps
**Learning:** When executing multiple independent Prisma queries (like counts) inside a loop or `.map()`, running them sequentially causes a significant latency bottleneck (N*M queries).
**Action:** Always wrap independent queries in `Promise.all()` even if they are already inside an outer `Promise.all()` for a `.map()`. This allows all independent queries to execute concurrently, drastically reducing overall latency.
