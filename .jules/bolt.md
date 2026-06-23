## 2026-06-22 - Batched Sequential Database Counts
**Learning:** Sequential `prisma.count()` calls in analytics controllers block the event loop and significantly increase response times.
**Action:** Always wrap independent, concurrent database read operations (like counting different metrics or filtering sets) in `Promise.all()` to execute them in parallel and reduce database bottleneck.
