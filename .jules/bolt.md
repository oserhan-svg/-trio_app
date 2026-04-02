## 2024-04-03 - Promise.all for Concurrent Database Queries
**Learning:** Performing multiple independent database aggregates or queries (e.g., `prisma.property.count()`) sequentially creates an artificial latency bottleneck due to compounded round-trip times.
**Action:** When calculating metrics or aggregating multiple independent statistics using Prisma in backend controllers, always use `Promise.all()` to run the database queries concurrently rather than sequentially.
