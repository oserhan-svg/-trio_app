## 2024-05-15 - N+1 Query in Loop
**Learning:** Prisma updates inside loops lead to N+1 bottlenecks.
**Action:** Push Prisma promises to an array and execute with `await prisma.$transaction(operations)`.
