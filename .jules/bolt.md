## 2024-07-04 - N+1 optimization with Prisma counts
**Learning:** In the Node.js backend (`adminController.js` and `analyticsController.js`), multiple independent `await prisma.property.count()` calls were being made sequentially to gather statistics for different sources (e.g. sahibinden.com, hepsiemlak.com). This introduces an N+1 query bottleneck.
**Action:** Always batch these independent Prisma queries using `Promise.all` to run them concurrently to minimize database roundtrips and event loop blocking.
