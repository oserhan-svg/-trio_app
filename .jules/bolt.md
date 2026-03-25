
## $(date +%Y-%m-%d) - Backend Prisma Promise.all Aggregations
**Learning:** When calculating metrics or aggregating multiple independent statistics using Prisma in backend controllers (like `adminController` and `analyticsController`), running the database queries sequentially can lead to N+1-like latency bottlenecks.
**Action:** Always group independent Prisma database queries inside `Promise.all()` to execute them concurrently, drastically reducing the total latency to the maximum execution time of the longest single query.
