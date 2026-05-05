## 2024-05-24 - Parallelizing Loop Promises
**Learning:** Sequential await calls inside `.map(async () => {...})` create severe N+1 latency bottlenecks, effectively multiplying the round-trip latency by the number of variables times the collection size.
**Action:** When calculating metrics or aggregating independent statistics inside an array mapping, group independent `await` calls using `Promise.all()` to execute them concurrently per iteration.
