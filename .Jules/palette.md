## 2025-05-15 - Standardized Asynchronous Feedback
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Use the `Button` component's `isLoading` prop for all asynchronous actions (forms, uploads, etc.) and always include `aria-label` for icon-only buttons to maintain accessibility standards.
