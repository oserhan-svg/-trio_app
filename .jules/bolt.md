## 2024-10-24 - Inner Promise.all for Maximum Concurrency
**Learning:** When iterating over collections to compute multiple independent metrics, executing `await` sequentially within `.map()` creates a latency bottleneck (N x M queries).
**Action:** Group inner independent queries using `Promise.all()` inside the outer `Promise.all()` to execute them fully concurrently.
