## 2024-05-24 - Resolving Prisma upsert N+1 Bottlenecks inside Loops
**Learning:** Sequential await calls for `prisma.model.upsert()` within loops create extreme database load and network latency issues, acting as an N+1 performance bottleneck. Using `Promise.all()` directly causes race conditions.
**Action:** Push Prisma promise objects to an array and batch them in chunks (e.g., 50) using `prisma.$transaction(operations.slice(j, j+50))`.
