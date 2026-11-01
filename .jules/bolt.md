## 2024-03-24 - Prisma Promise.all concurrency limit

**Learning:** When trying to resolve N+1 queries by pushing them into an array and using `Promise.all` inside loops, using `Promise.all` with individual `await prisma.model.count()` inside a `.map` loop introduces massive database connection spikes and memory overhead, effectively replacing an N+1 query issue with a connection pool exhaustion problem.

**Action:** When dealing with multiple independent queries across an iteration, especially aggregate queries like `.count`, use Prisma's native `Promise.all([ ... ])` inside the mapping operation rather than awaiting them individually sequentially, or better yet, aggregate them beforehand using `groupBy` when possible.
