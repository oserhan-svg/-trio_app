
## 2024-04-06 - Prisma Concurrent Queries inside `.map()`
**Learning:** Sequential Prisma queries inside `.map()` calls can become latency bottlenecks.
**Action:** Always use an inner `Promise.all()` to wrap multiple concurrent Prisma queries inside the `.map()` block to maximize concurrency and avoid N+1-like performance degradation.
