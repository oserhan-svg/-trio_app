## 2024-05-24 - N+1 in repairGroups
**Learning:** Sequential Prisma upserts inside a `for...of` loop cause N+1 database queries.
**Action:** Use chunk-based concurrency with `Promise.all` to execute queries concurrently without exhausting the connection pool.
