## 2024-09-17 - Prisma Connection Pool Exhaustion from Unbounded Concurrency
**Learning:** Using unbounded `Promise.all` on large arrays of Prisma operations (like N+1 upserts in loops) can exhaust the database connection pool in this architecture.
**Action:** Always use chunk-based concurrency (e.g., batches of 20-50) and `await Promise.all()` within a chunk loop to safely resolve N+1 bottlenecks without overwhelming the connection pool.
