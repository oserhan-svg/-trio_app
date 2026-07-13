## 2024-05-19 - Batching Contains Queries
**Learning:** Prisma's `groupBy` cannot be used with partial matching operators like `contains`. In `adminController` and `analyticsController`, independent property counts by source URL must be batched with `Promise.all` instead of grouped.
**Action:** When optimizing concurrent counts on the same model, check if conditions use `contains`; if they do, fall back to `Promise.all`.
