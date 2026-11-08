## 2024-05-18 - Resolve N+1 sequential awaits in Promise.all loops
**Learning:** Found sequential independent `prisma.count` operations nested inside `Promise.all(map(...))` in `performanceController.js` and other controllers, leading to sequential I/O overhead.
**Action:** Always wrap independent queries happening in loop iterations in an inner `Promise.all` to execute them concurrently, minimizing query turnaround times.
