## 2024-04-16 - Resolving N+1 Variants with Promise.all()
**Learning:** When generating complex metrics for admin or performance dashboards, sequential database queries within mapping loops (like `.map` operations) create severe performance bottlenecks and artificial N+1 query latency. This compounds rapidly as total clients and active consultants grow.
**Action:** Always group mutually independent analytical queries within `Promise.all()` to execute them concurrently, especially when iterating over collections or calculating parallel statistics.
