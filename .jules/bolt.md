## 2024-06-03 - [Prisma N+1 Optimization]
**Learning:** Prisma `count` in a `.map` over multiple records (like users) causes severe N+1 query bottlenecks.
**Action:** Replace sequential `.count` calls inside loops with batched `prisma.*.groupBy` or `.findMany` over the entire array of target IDs, reducing queries from O(N*M) to O(1) batched queries. Remember that Prisma groupBy requires passing `_count: { _all: true }`.
