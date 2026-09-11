## 2024-05-24 - Chunk-based concurrency for DB loops
**Learning:** N+1 queries caused by sequential Prisma `upsert` and `update` operations inside `for...of` loops (such as in `whatsappController.js`) block execution flow unnecessarily. However, using unbounded `Promise.all` on large arrays can cause database connection pool exhaustion.
**Action:** Refactor loops processing arrays into chunk-based concurrency using slices of 20-50 and `await Promise.all()` within the chunk loop to safely utilize the DB connection pool.
