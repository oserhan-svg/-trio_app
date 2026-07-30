## 2024-07-29 - [Batching Prisma Counts]
**Learning:** Making multiple independent `await prisma.*.count()` calls sequentially in Node.js/Prisma introduces an N+1 bottleneck, slowing down performance analytics pages.
**Action:** Always batch independent Prisma queries concurrently using `Promise.all` to run them simultaneously.