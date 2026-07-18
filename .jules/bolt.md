## 2024-07-25 - Analytics N+1 BottleNeck
**Learning:** Found sequential Prisma count queries without Promise.all in server/controllers/analyticsController.js which causes a backend N+1 bottleneck, slowing down analytics stats endpoint.
**Action:** Always batch independent Prisma aggregate queries using Promise.all to run them concurrently.
