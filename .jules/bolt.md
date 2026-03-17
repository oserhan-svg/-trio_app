## 2024-05-24 - [Promise.all for Concurrent Prisma Analytics Queries]
**Learning:** Sequential `prisma.count()` and similar aggregator queries in high-throughput dashboard endpoints create significant aggregate latency.
**Action:** Always group independent Prisma aggregate queries into a single `Promise.all` block. This reduces total DB wait time to the time of the single slowest query, turning `O(n)` sequential latency into `O(1)` concurrent latency.
