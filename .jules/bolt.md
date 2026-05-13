## 2024-05-15 - Optimize Backend Aggregation Queries
**Learning:** The `analyticsController.js` had multiple independent `await` calls for Prisma counts and external services, leading to a waterfall effect.
**Action:** When calculating metrics or aggregating multiple independent statistics using Prisma or independent async data service calls in backend controllers, always use `Promise.all()` to execute them concurrently rather than sequentially to avoid latency bottlenecks.
