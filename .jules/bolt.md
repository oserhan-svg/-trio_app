## 2024-05-24 - Prisma N+1 Aggregate Optimizations
**Learning:** Making multiple independent `await prisma.*.count()` calls sequentially in Node controllers (e.g., `analyticsController.js`, `adminController.js`) introduces a significant N+1 bottleneck, slowing down dashboard load times.
**Action:** Always batch these independent Prisma aggregate queries using `Promise.all` to run them concurrently.
