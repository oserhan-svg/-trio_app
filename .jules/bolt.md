## 2024-08-10 - Batching non-groupable Prisma counts
**Learning:** Sequential Prisma `.count()` calls sharing overlapping tables but utilizing partial text matches (like `contains`) cannot be aggregated using Prisma's `groupBy` because grouping doesn't support substring operators.
**Action:** Always batch these independent counts concurrently using `Promise.all` to eliminate N+1 latency bottlenecks when partial matching operators are involved.
