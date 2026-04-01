## 2025-05-23 - [Consolidated SQL Counts and Parallelization]
**Learning:** Consolidating multiple conditional counts into a single PostgreSQL query using `COUNT(*) FILTER (WHERE ...)` reduces database round-trips from N to 1. Additionally, parallelizing independent data-fetching tasks with `Promise.all` in the controller layer significantly reduces the total response time for analytics dashboards.
**Action:** Always look for patterns where multiple `count()` or `findMany()` calls target the same table with different filters and consolidate them into a single raw SQL query for high-performance paths.

## 2025-05-23 - [Centralized Cache Governance]
**Learning:** Migrating from ad-hoc local cache objects to a centralized `CacheService` with namespacing and TTL prevents memory leaks and ensures consistent caching behavior across the application.
**Action:** Refactor services using internal `this.cache` to use `CacheService.getOrSet` to enforce uniform TTL and memory governance.
