## 2024-10-25 - Chunked Prisma Concurrency
**Learning:** Sequential Prisma upserts inside loops cause N+1 bottlenecks, but unbounded Promise.all on large datasets exhausts connection pools.
**Action:** When refactoring sequential loops for database operations, always slice arrays into chunks of 20-50 and use `await Promise.all()` within a chunk loop.
