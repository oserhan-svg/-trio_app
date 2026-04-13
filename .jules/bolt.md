## 2024-04-13 - Concurrent Async Execution in Map Loops
**Learning:** In the Node.js backend controllers, independent Prisma queries and async data service calls inside `.map()` loops or outer scopes are often executed sequentially, causing N+1 latency bottlenecks.
**Action:** When calculating metrics or aggregating multiple independent statistics, always use `Promise.all()` to execute them concurrently rather than sequentially. When iterating over collections (e.g., using `.map()`), wrap the inner grouped `Promise.all` inside another outer `Promise.all` for maximum concurrency.
