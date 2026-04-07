## 2026-04-07 - Centralized Loading States in Button Component
**Learning:** Prioritize centralizing loading states within the base `Button` component using the `isLoading` prop instead of manual string replacement (e.g., 'Save' to 'Saving...') to ensure standardized visual feedback and ARIA accessibility (`aria-busy`, `aria-live`).
**Action:** Always check the base `Button` component for `isLoading` support before implementing manual loading logic in forms.
