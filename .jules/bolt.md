## 2024-08-20 - Batching Sequential Database Count Queries
**Learning:** Sequential, independent database count queries create a performance bottleneck due to connection overhead and sequential latency blocking the event loop.
**Action:** Batch independent `count()` queries (and similar lookups) using `Promise.all` to allow concurrent execution and reduce total execution time, taking care not to use `groupBy` with partial matching operators.
