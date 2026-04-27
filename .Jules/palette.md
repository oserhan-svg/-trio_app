## 2025-05-15 - Standardizing Asynchronous Feedback via Button Component
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Always prefer the `isLoading` prop on the `Button` component over manual loading state management within forms to maintain UX consistency and accessibility standards.
