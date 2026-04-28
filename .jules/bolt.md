## 2024-05-18 - Concurrent Independent Prisma Counts
**Learning:** Grouping multiple independent Prisma aggregate queries (like counts) sequentially causes a latency bottleneck, especially on dashboard endpoints doing many such counts.
**Action:** Always wrap independent `prisma.x.count()` or similar aggregate queries inside `Promise.all()` to execute them concurrently and reduce total endpoint response time.
