## 2024-07-24 - N+1 and Unbatched Prisma queries
**Learning:** Found multiple instances of `prisma.property.count()` running sequentially when calculating stats, causing N+1 query bottlenecks, especially in `server/controllers/adminController.js` and `server/controllers/analyticsController.js`.
**Action:** Use `Promise.all` to batch independent Prisma count queries, reducing database roundtrips and resolving the sequential execution bottleneck.
