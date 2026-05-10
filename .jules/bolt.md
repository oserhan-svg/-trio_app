## 2024-05-10 - Independent Sequential Awaits in Loop Bottleneck
**Learning:** Using multiple independent `await` statements (e.g., `prisma.property.count()`) sequentially inside an array map loop causes severe N+1 latency bottlenecks, as each query waits for the previous one to complete before starting.
**Action:** Always group independent asynchronous database queries using `Promise.all()` to execute them concurrently, drastically reducing execution time.
