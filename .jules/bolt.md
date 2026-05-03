## 2025-05-14 - [React Component Definition Anti-pattern]
**Learning:** Defining a component (like `SortHeader`) inside another component's render function causes it to be re-created on every render, leading to full unmounts/remounts and significant performance degradation. Additionally, `React.memo` on child components (like `PropertyRow`) is ineffective if props (like callback handlers) are fresh references on each render.
**Action:** Always define sub-components outside of the parent render function and use `useCallback` to stabilize function references passed to memoized children.
