## 2024-08-11 - [Optimize independent prisma queries concurrently]
**Learning:** The nodejs codebase often does multiple independent query checks like count sequentially for dashboard-like views. Since Prisma handles these individually and they aren't sequentially dependent, using sequential awaits blocks the event loop unnecessarily.
**Action:** Whenever possible, use `Promise.all` to batch independent `prisma.*` queries on non-dependent data, especially on dashboard endpoints to reduce latency.
