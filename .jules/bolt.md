## 2024-07-20 - Batch Independent Count Queries
**Learning:** Found an N+1 bottleneck where multiple `await prisma.property.count()` calls for different sources were executed sequentially.
**Action:** When making multiple independent aggregate queries, always batch them concurrently using `Promise.all` to reduce total query wait time.