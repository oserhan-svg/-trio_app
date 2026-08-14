## 2024-05-20 - React.memo fail with inline function
**Learning:** `React.memo` wrapping a child component (`PropertyRow`) will fail if the parent component (`PropertyTable`) passes an inline arrow function or an unmemoized function to it as a prop. Every time the parent re-renders, the unmemoized function is redefined, causing the child to re-render.
**Action:** When using `React.memo` for performance, always wrap functions passed as props to the memoized component with `useCallback` to prevent breaking the memoization.
