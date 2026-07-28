## 2024-05-24 - Prisma Concurrent Query Optimization
**Learning:** The application calculates multiple dashboard and analytics statistics using independent `prisma.property.count()` calls based on partial text matches (e.g., `url: { contains: '...' }`). Running these sequentially introduces an N+1 I/O bottleneck. Because these text-search conditions are incompatible with standard `groupBy`, they must be explicitly batched.
**Action:** Always batch independent Prisma aggregate queries concurrently using `Promise.all` when calculating statistics across multiple overlapping string conditions.
