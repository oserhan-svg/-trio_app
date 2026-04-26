## 2025-05-15 - Property Matching Pre-normalization
**Learning:** Performing string transformations (lowercase, whitespace removal) and object creation (Set, JSON.stringify) inside O(N*M) nested loops is a major CPU bottleneck. For a property pool of 1000 items and a client with 5 demands, these operations were repeating 5,000 times per request.
**Action:** Pre-normalize static data (Property Pool) during cache hydration and pre-process request-specific context (Client Demands/AI Summary) before entering the scoring loop.
