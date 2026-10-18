## 2023-10-27 - [N+1 Bottleneck in loops]
**Learning:** Sequential Prisma `upsert` queries inside a `for...of` loop can cause an N+1 bottleneck. Using `Promise.all` can introduce race conditions and does not batch the queries.
**Action:** Push the operations into an array and execute them in chunks (e.g. 50) using `await prisma.$transaction(operationsChunk)` to reduce database roundtrips safely.
