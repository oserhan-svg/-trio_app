## 2024-04-05 - Bulk Queries in Admin Stats
**Learning:** Sequential Prisma count queries introduce significant latency bottlenecks (N+1-like issue) in Express controllers. Node.js backend performance is largely IO bound.
**Action:** Always wrap independent database queries or external API calls inside `Promise.all()` to maximize concurrency and minimize total network latency.
