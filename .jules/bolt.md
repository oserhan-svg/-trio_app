## 2024-10-24 - Concurrent Prisma Queries in Iterations
**Learning:** Sequential await calls inside `.map()` loops (even when wrapped in an outer `Promise.all`) multiply latency unnecessarily. Each independent query adds to the total execution time of the iteration.
**Action:** Always wrap independent async operations (like Prisma `count` queries) within a single iteration inside an inner `Promise.all()` to execute them concurrently, maximizing throughput.
