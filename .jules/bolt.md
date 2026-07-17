## 2024-05-24 - Batch Sequential Prisma Counts
**Learning:** Found sequential independent `prisma.property.count()` calls in `adminController.js` and `analyticsController.js` creating an N+1 bottleneck. Since they use partial matching operators like `contains`, they cannot be batched with `groupBy`.
**Action:** Always batch independent Prisma aggregate queries that cannot use `groupBy` concurrently using `Promise.all` to reduce database overhead.
