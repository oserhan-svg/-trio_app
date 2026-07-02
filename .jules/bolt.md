## 2025-02-18 - Fix N+1 Query in Performance Dashboard
**Learning:** Found a severe N+1 query problem where getting consultant performance made 5 synchronous `prisma.*.count` queries inside a Promise.all loop for every single consultant.
**Action:** Replaced looped single-condition queries with grouped batch queries using Prisma's `.groupBy` and a local object map. This reduces N*5 queries into just 4 DB roundtrips regardless of consultant count.
