
## 2024-05-29 - Optimize Aggregate Metrics Loop
**Learning:** In backend controllers, calculating multiple independent aggregate metrics (e.g., `count`) sequentially inside `.map()` arrays leads to N+1 query latency bottlenecks per iteration.
**Action:** Always wrap independent `.count()` or query calls inside grouped `Promise.all()` structures, even when already inside an outer `Promise.all()` for loops, to ensure maximum concurrency.
