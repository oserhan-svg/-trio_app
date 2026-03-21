## 2026-03-21 - Parallelize independent controller queries
**Learning:** Sequential execution of independent database counts and service calls in a single endpoint creates additive latency that scales with the number of queries. For the main analytics dashboard, this was causing measurable delays.
**Action:** Use `Promise.all` to execute independent asynchronous operations concurrently in controller handlers to minimize response time.
