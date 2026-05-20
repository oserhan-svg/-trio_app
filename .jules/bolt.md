## 2024-05-21 - Concurrent Database Queries
**Learning:** Independent `prisma.count` or other independent `prisma` queries inside controllers are sometimes executed sequentially with `await` on each line, creating unnecessary latency bottlenecks.
**Action:** Always use `Promise.all()` to execute independent database queries concurrently.
