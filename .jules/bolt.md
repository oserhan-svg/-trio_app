## 2024-05-18 - Batching Independent Database Queries
**Learning:** I noticed that `getStats` in `server/controllers/analyticsController.js` was making multiple independent `prisma.property.count()` queries consecutively, awaiting each one sequentially. This causes a waterfall effect and increases the total response time for the analytics endpoint, which is queried frequently (e.g., when loading the Dashboard).
**Action:** Always look for opportunities to batch independent database queries using `Promise.all()`. This is a low-hanging fruit for backend performance optimization.
