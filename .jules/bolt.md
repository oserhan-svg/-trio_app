## $(date +%Y-%m-%d) - Concurrency inside loops
**Learning:** Sequential awaits inside a `Promise.all(array.map(...))` loop create significant N+1-like latency bottlenecks because internal operations don't overlap.
**Action:** Group inner operations into a secondary `Promise.all` inside the map loop so each iteration executes its internal queries concurrently.
