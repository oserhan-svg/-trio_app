## 2024-08-20 - Sequential database queries
**Learning:** Sequential Prisma queries block the node event loop unnecessarily when there are multiple independent DB interactions in a single endpoint.
**Action:** Always batch independent queries like `.count()` or `.findMany()` using `Promise.all()` to decrease overall database roundtrip time.
