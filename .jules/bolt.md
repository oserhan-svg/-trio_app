## 2024-08-03 - [Prisma Sequential Queries Optimization]
**Learning:** Making multiple independent `await prisma.*.count()` calls sequentially introduces an N+1 bottleneck and unnecessary latency, especially inside loops like `consultants.map(async (c) => ... )`.
**Action:** Always batch independent Prisma queries concurrently using `Promise.all` to run them in parallel and reduce database roundtrips.
