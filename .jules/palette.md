## 2025-05-15 - [Centralized Loading States]
**Learning:** Standardizing loading feedback within the base `Button` component using an `isLoading` prop ensures consistent visual cues and accessibility (`aria-busy`, `aria-live`) across the application, while also simplifying call-site logic.
**Action:** Always prioritize using the `isLoading` prop on the base `Button` component instead of manual conditional rendering for asynchronous operations.
