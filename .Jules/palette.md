## 2026-04-24 - [Standardizing Asynchronous Feedback]
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Always prefer using the enhanced `Button` component for actions that trigger network requests or long-running processes.
