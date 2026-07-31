## 2026-07-30 - [Optimizing Backend Prisma Counts with Promise.all]
**Learning:** [Sequential independent `await prisma.*.count()` calls introduce an N+1 bottleneck in the Node.js backend. Using `prisma.*.groupBy` is not viable for queries utilizing partial matching operators like `contains`.]
**Action:** [Batch independent Prisma queries using `Promise.all` to run them concurrently, especially when conditions involve `contains`.]
