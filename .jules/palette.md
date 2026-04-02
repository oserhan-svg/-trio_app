## 2025-05-15 - Standardized Button Loading States
**Learning:** Manual text-swapping for loading states (e.g., "Saving..." vs "Save") is inconsistent and often lacks proper ARIA attributes. Implementing a centralized `isLoading` prop in the base `Button` component ensures consistent visual feedback (spinners) and accessibility (`aria-busy`, `aria-live`) across the application.
**Action:** Always check the base `Button` component for `isLoading` support before implementing custom loading logic in forms. If missing, prioritize enhancing the base component.
