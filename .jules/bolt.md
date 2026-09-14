## 2025-02-28 - WhatsApp Sync Bottleneck
**Learning:** Resolving N+1 bottlenecks caused by sequential Prisma `upsert` or `update` operations inside `for...of` loops (e.g., in `whatsappController.js`) requires care. Avoid unbounded `Promise.all` on large arrays as it can cause database connection pool exhaustion.
**Action:** Use chunk-based concurrency (e.g., slicing arrays into batches of 20) and `await Promise.all()` within a chunk loop to safely utilize the connection pool while significantly speeding up processing.
