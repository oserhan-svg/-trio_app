## 2025-05-14 - Centralized Button Loading State
**Learning:** Prioritizing centralizing loading states within the base `Button` component using an `isLoading` prop instead of manual string replacement (e.g., 'Save' to 'Saving...') ensures standardized visual feedback and ARIA accessibility (`aria-busy`, `aria-live`) across the entire application.
**Action:** Always check the base `Button` component for `isLoading` support before implementing custom loading logic in forms.
