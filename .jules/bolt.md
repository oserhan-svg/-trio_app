## 2024-05-24 - Sequential Prisma Queries Bottleneck
**Learning:** The codebase has a pervasive anti-pattern of executing independent Prisma metric queries sequentially (e.g., multiple `await prisma.*.count()` calls) in controllers like `performanceController.js`, causing cumulative latency, particularly inside `.map()` loops.
**Action:** Always group independent Prisma queries and execute them concurrently using `Promise.all()`. When iterating over collections, nest inner `Promise.all()` calls inside the outer `Promise.all()` mapped array to maximize concurrency.
