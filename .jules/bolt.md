## 2024-07-15 - Batching sequential Prisma count queries
**Learning:** Sequential await calls on independent prisma.*.count inside map loops introduce significant N+1 bottlenecks.
**Action:** Always wrap independent await prisma.* aggregate queries in a Promise.all array to execute them concurrently when fetching multiple stats.
