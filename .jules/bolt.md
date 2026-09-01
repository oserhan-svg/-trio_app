## 2025-02-19 - Chunk-based Concurrent Prisma Updates
**Learning:** Sequential Prisma updates inside for...of loops (e.g., in whatsappController.js) cause N+1 bottlenecks during bulk operations, but unbounded Promise.all exhausts the database connection pool.
**Action:** Use chunk-based concurrency (batching ~50 items) with Promise.all to safely accelerate database operations without overwhelming the pool.
