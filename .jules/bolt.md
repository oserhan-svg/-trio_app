## 2024-05-19 - N+1 Query in performanceController

**Learning:** The `getConsultantPerformance` and `getConsultantDetail` methods in `performanceController.js` had major N+1 query problems because they executed 5 individual `count` queries per consultant per month inside a loop.
**Action:** Always wrap concurrent DB queries inside `Promise.all` instead of awaiting them sequentially within loops, to achieve maximum concurrency and reduce connection latency bottlenecks.
