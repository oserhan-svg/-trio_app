## 2024-05-11 - Promise.all Optimization in Controllers
**Learning:** Sequential, independent Prisma aggregations in analytics controller block execution unnecessarily.
**Action:** Always wrap independent async database operations in `Promise.all()` to parallelize queries.
