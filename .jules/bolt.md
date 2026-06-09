## 2024-06-08 - Optimize overlapping Prisma counts
**Learning:** Prisma `count` calls with overlapping query conditions (like counting active buyers and sellers separately) can be merged using a single `groupBy` to reduce database overhead.
**Action:** Replace multiple concurrent `prisma.*.count` calls that share overlapping query conditions with a single `prisma.*.groupBy` call to extract counts in a single query.
