## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]
## 2024-11-13 - Avoid Sequential Awaits in Metrics Aggregation
**Learning:** Sequential await calls for independent Prisma queries (e.g., counts, groupBys) inside iteration loops (like `.map`) cause significant latency bottlenecks.
**Action:** Always group independent Prisma queries using `Promise.all()`. When iterating over collections, wrap the inner grouped `Promise.all` inside another outer `Promise.all` to achieve maximum concurrency.
