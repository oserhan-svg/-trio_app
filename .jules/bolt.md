## 2024-08-01 - Batch Prisma Counts
**Learning:** In the Node.js backend, making multiple independent `await prisma.*.count()` (or similar aggregate) calls sequentially introduces an N+1 bottleneck. Since these conditions use partial matching operators (`contains`) they are incompatible with `groupBy`.
**Action:** Always batch these independent Prisma queries using `Promise.all` to run them concurrently.
