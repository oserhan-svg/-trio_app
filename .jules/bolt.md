## 2024-07-09 - Parallelizing Sequential Prisma Aggregates
**Learning:** The codebase heavily uses sequential `await prisma.*.count()` and `.findMany()` calls inside loops (like mapping over consultants or months), introducing a severe N+1 bottleneck and blocking the event loop unnecessarily.
**Action:** Always batch independent, non-overlapping Prisma aggregate/find queries using `Promise.all` to run them concurrently, dramatically reducing database overhead and response times.
