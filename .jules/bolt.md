## 2024-03-27 - Aggregating Independent Metrics with Promise.all
**Learning:** Sequential Prisma queries within iterative loops (like `map`) or within large data aggregation functions create massive N+1-like latency bottlenecks, especially when fetching multiple independent statistics.
**Action:** Always group independent Prisma `count`, `findMany`, and `groupBy` queries into a single `Promise.all` block. When iterating over collections to fetch data, wrap the inner grouped `Promise.all` inside another outer `Promise.all` for maximum concurrency.
