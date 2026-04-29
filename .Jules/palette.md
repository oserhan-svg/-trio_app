## 2026-04-29 - [Standardized Loading States]
**Learning:** Standardizing asynchronous feedback via a centralized `Button` component with `isLoading` and `loadingText` props reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application.
**Action:** Always use the `isLoading` prop on the `Button` component for async actions instead of manual ternary operators or custom spinners.
