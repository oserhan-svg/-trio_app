## 2024-04-15 - Concurrent Prisma Metrics
**Learning:** Independent Prisma aggregate queries (e.g., counts) within `.map` loops execute sequentially by default, leading to unnecessary latency bottlenecks (N*M database roundtrips).
**Action:** Wrap inner grouped independent database calls within `Promise.all()` to maximize concurrency and reduce total query time.
