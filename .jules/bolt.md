## 2024-05-24 - N+1 Latency bottlenecks inside loops
**Learning:** Sequential await calls on independent database queries (especially inside loops like `map`) cause a massive latency bottleneck because each query waits for the previous one to complete. This is essentially an N+1 problem variant.
**Action:** Always use `Promise.all` to group independent queries so they run concurrently, reducing overall execution time. If inside a map, wrap the returned promises in another `Promise.all` at the loop level.
