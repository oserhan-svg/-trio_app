## 2024-05-19 - N+1 Bottleneck in whatsappController
**Learning:** Sequential Prisma updates inside `for...of` loops cause N+1 database connection overhead, severely impacting performance for batch operations. Using unbounded `Promise.all` can cause connection pool exhaustion.
**Action:** Use chunk-based concurrency (e.g., slicing arrays into batches of 50) and `await Promise.all()` within a chunk loop to fully utilize the Prisma connection pool while preventing exhaustion.
