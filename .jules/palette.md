## 2025-05-14 - Centralized Loading States and ARIA Access
**Learning:** Prioritize centralizing loading states within the base `Button` component using the `isLoading` prop instead of manual string replacement (e.g., 'Save' to 'Saving...') to ensure standardized visual feedback and ARIA accessibility (`aria-busy`, `aria-live`).
**Action:** Always check the base `Button` component for `isLoading` support and use it to maintain UX consistency and screen-reader compatibility.
