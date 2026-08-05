## 2024-08-04 - [Fix N+1 query problems in Prisma count calls]
**Learning:** Sequential, independent `await prisma.*.count()` (or similar aggregate) calls in backend controllers create a major N+1 latency bottleneck.
**Action:** Always batch these independent Prisma queries concurrently using `Promise.all` to reduce database overhead.
