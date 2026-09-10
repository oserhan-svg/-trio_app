## 2024-05-24 - Database Connection Pool Exhaustion in Sync Loops
**Learning:** Sequential Prisma `upsert` operations inside `for...of` loops (like in `syncAllData`) cause N+1 bottlenecks. However, blindly switching to unbounded `Promise.all` for large arrays (like chat messages) crashes the application due to Prisma connection pool exhaustion.
**Action:** Always use chunk-based concurrency (slicing arrays into batches of 20-50) with `await Promise.all()` within the chunk loop to balance speed and connection pool safety when resolving N+1 Prisma bottlenecks.
