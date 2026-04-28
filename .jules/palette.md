## 2025-05-14 - Standardized Async Feedback Pattern
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Always prefer using the standardized `Button` component's `isLoading` prop over manual loading state logic in individual components to maintain UX consistency and accessibility standards.
