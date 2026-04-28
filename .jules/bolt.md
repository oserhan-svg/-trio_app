## 2025-05-14 - Request Collapsing (Cache Stampede Prevention)
**Learning:** Multiple concurrent requests to a cold cache or expensive calculation (like DB aggregations) can trigger redundant operations, overloading the database.
**Action:** Implement the "pending promise" pattern to collapse concurrent requests into a single operation. Ensure the promise is cleared in a `finally` block to allow for future retries if the initial operation fails.

## 2025-05-14 - React Render Optimization
**Learning:** Defining a functional component inside another component's render body causes the child to be recreated and re-mounted on every parent render, losing state and hurting performance.
**Action:** Always define sub-components outside the main component or move them to separate files.

## 2025-05-14 - Effective React Memoization
**Learning:** `React.memo` is only effective if all passed props maintain referential equality. Inline function handlers passed as props will break this.
**Action:** Use `useCallback` for all event handlers and callbacks passed to memoized child components to ensure stable references.
