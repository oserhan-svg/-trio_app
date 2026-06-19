## 2024-06-19 - Optimize Consultant Performance Queries
**Learning:** Using Prisma's `count` in a `.map` loop for N entities causes severe N+1 query bottlenecks and slows down API performance.
**Action:** Always batch queries using `groupBy` with `_count: { _all: true }` and build memory lookup maps, or use `findMany` when dealing with relation counts.