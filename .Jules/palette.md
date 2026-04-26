## 2025-05-15 - Standardized Asynchronous Button Feedback
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Use the `isLoading` and `loadingText` props on the shared `Button` component for all asynchronous operations to provide consistent visual and screen-reader feedback.
