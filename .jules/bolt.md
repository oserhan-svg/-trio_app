## 2025-02-24 - Inner Promise.all for Metric Aggregations
**Learning:** Found sequential independent DB calls (`saleCount`, `rentCount`, etc.) inside an outer `Promise.all(map(...))` in `performanceController.js`. Even though the loop iterations were concurrent, each iteration was internally bottle-necked by sequential DB round-trips.
**Action:** When calculating metrics or aggregating independent async data in backend controllers, always group them using `Promise.all()` even if already inside a mapped `Promise.all()`. This maximizes concurrency and prevents compounding latency.
