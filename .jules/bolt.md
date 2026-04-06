## 2025-02-12 - Parallelize independent Prisma queries
**Learning:** Sequential N+1 queries in Express controllers (`adminController` and `analyticsController`) severely limit throughput and increase total latency, particularly as database records grow.
**Action:** Identify independent `prisma` queries or external service calls in identical endpoint routines and wrap them inside `Promise.all()` to achieve concurrent execution and massive latency reduction.
